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

@frappe.whitelist()
def get_items_from_stocksheets(stock_sheets):
    #Merge quantity of same items from same warehouse in stock_sheets
    stock_sheets  = json.loads(stock_sheets)
    items = {}
    for row in stock_sheets:
        stock = frappe.get_doc('Stock Sheet', row['name'])
        if (stock.items[0].item_code in items) and items[stock.items[0].item_code].warehouse == stock.items[0].warehouse:
            items[stock.items[0].item_code].qty += stock.items[0].qty
        else:
            items[stock.items[0].item_code] = stock.items[0]
    return items
