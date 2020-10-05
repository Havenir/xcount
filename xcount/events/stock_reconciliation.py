from __future__ import unicode_literals
import frappe
import json


def validate_items_and_stock_sheets(doc, method):
    #Validate if stock_sheets are not reconciled yet
    for row in doc.stock_sheets:
        print(row.stock_sheet)
        stock_sheet = frappe.get_doc('Stock Sheet', row.stock_sheet)
        if stock_sheet.reconciled == 1:
            frappe.throw('Stock Sheet# {0} is already reconciled'.format(stock_sheet.name))
        else:
            stock_sheet.db_set('reconciled', 1)

@frappe.whitelist()
def get_items_from_stocksheets(stock_sheets):
    #Merge quantity of same items from same warehouse in stock_sheets
    stock_sheets  = json.loads(stock_sheets)
    items = {}
    for row in stock_sheets:
        stock = frappe.get_doc('Stock Sheet', row['name'])
        for item in stock.items:
            item_tuple = (item.item_code, item.warehouse, item.batch_no)
            if not item_tuple in items:
                items[item_tuple] = item.qty
            else:
                items[item_tuple] += item.qty
    item_array = []
    for row in items:
        item_array.append({
            'item_code': row[0],
            'warehouse': row[1],
            'qty': items[row],
            'batch_no': row[2]
        })
    return item_array
