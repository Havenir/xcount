frappe.ui.form.on('Stock Reconciliation', {
    refresh: function (frm) {
        frm.events.purpose(frm);
    },
    purpose: function (frm) {  
        console.log(frm.doc.purpose);
        if (frm.doc.purpose === 'Stock Reconciliation'){
            frm.events.create_stock_sheet_button(frm);
        }
    },
    create_stock_sheet_button: function (frm) {  
        if (frm.doc.docstatus === 0){
            frm.add_custom_button(__("Get Stock Count Sheets"), function() {
                if (!frm.doc.warehouse){
                    frappe.msgprint('No Warehouse selected')
                }else{
                    frm.trigger('get_stock_sheets');
                }
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
            if (records.length === 0){
                frappe.msgprint(`No Stock Count Sheet pending for ${frm.doc.warehouse}`);
            }
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
        
    },
    set_batch_query: function (frm, cdt, cdn) {  
        let row = frappe.get_doc(cdt, cdn)
        if (row.item_code && row.warehouse){
            row.batch_no = null;
            frm.refresh_field('items')
            frm.set_query('batch_no', 'items', () => {
                return {
                    filters: {
                        item  : row.item_code
                    }
                }
            })
        }
    }
})

frappe.ui.form.on('Stock Reconciliation Item', {
    item_code: function (frm, cdt, cdn) {  
        frm.events.set_batch_query(frm, cdt, cdn);

    },
    warehouse: function (frm, cdt, cdn) {  
        frm.events.set_batch_query(frm, cdt, cdn);
    }
})