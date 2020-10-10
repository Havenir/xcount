from __future__ import unicode_literals
import frappe
import json
from erpnext.stock.doctype.batch.batch import get_batch_qty, get_batches


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
def get_items_from_stocksheets(stock_sheets, warehouse, make_uncounted_items_zero = None):
    #Merge quantity of same items from same warehouse in stock_sheets
    stock_sheets  = json.loads(stock_sheets)
    items = {}
    items_set = set()
    for row in stock_sheets:
        stock = frappe.get_doc('Stock Sheet', row)
        for item in stock.items:
            items_set.add(item.item_code)
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

    if not item_array: 
        return item_array
    
    if make_uncounted_items_zero:
        bin_list = frappe.get_list('Bin', filters = {'warehouse': warehouse}, fields = ['item_code'])
        for row in bin_list:
            if row.item_code not in items_set:

                has_batch = frappe.get_value('Item', row.item_code, 'has_batch_no')
                if has_batch: 
                    batches = get_batches(row.item_code, warehouse)
                    for batch in batches:
                        if batch.qty > 0:
                            item_array.append({
                                'item_code': row.item_code,
                                'warehouse': warehouse,
                                'qty': 0,
                                'batch_no': batch.batch_id
                            })
                else:
                    item_array.append({
                    'item_code': row.item_code,
                    'warehouse': warehouse,
                    'qty': 0
                })
    return item_array
