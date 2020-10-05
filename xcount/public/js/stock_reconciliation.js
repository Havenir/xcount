frappe.ui.form.on('Stock Reconciliation', {
    refresh: function (frm) {
        if (frm.doc.docstatus === 0){
            frm.add_custom_button(__("Stock Count Sheets"), function() {
				frm.trigger('get_stock_sheets');
			});
        }
    },

    get_stock_sheets: function (frm) {
        frappe.db.get_list('Stock Sheet', {
            fields: ['name', 'stock_count_date', 'default_warehouse'],
            filters: {
                reconciled: 0,
                docstatus: 1
            }
        }).then(records => {
            frm.doc.stock_sheets = []
            frm.doc.items = []
            for (let row in records) {
                frm.add_child('stock_sheets', {
                    'stock_sheet': records[row].name,
                    'stock_count_date': records[row].stock_count_date
                })
            }

            frm.refresh_field('stock_sheets');

            frappe.call('xcount.events.stock_reconciliation.get_items_from_stocksheets', 
            {stock_sheets : records})
            .then(r => {
                for (let row in r.message) {
                    frm.add_child('items', {
                        'item_code': r.message[row].item_code,
                        'warehouse': r.message[row].warehouse,
                        'qty': r.message[row].qty,
                        'batch_no': r.message[row].batch_no
                    })
                }
                frm.refresh_field('items');
            })
        })
        
    }
})