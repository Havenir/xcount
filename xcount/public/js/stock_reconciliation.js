frappe.ui.form.on('Stock Reconciliation', {
    refresh: function (frm) {
        frm.events.purpose(frm);
    },
    purpose: function (frm) {  
        if (frm.doc.purpose === 'Stock Reconciliation'){
            frm.events.create_stock_sheet_button(frm);
        }
    },
    create_stock_sheet_button: function (frm) {  
        if (frm.doc.docstatus === 0){
            frm.add_custom_button(__("Get Stock Count Sheets"), function() {
                frm.trigger('get_stock_sheets');
			});
        }
    },

    get_stock_sheets: function (frm) {
        // Dialog to select Stock Sheets

        frappe.prompt({
            label: 'Warehouse',
            fieldname: 'warehouse',
            fieldtype: 'Link',
            options: 'Warehouse'
        }, (values) => {
            new frappe.ui.form.MultiSelectDialog({
                doctype: "Stock Sheet",
                target: frm,
                setters: {
                    company: frm.doc.company
                },
                date_field: "stock_count_date",
                get_query() {
                    return {
                        filters: { 
                            docstatus: ['=', 1],
                            default_warehouse: values.warehouse,
                            reconciled: 0
                        }
                    }
                },
                action(selections) {
                    if (selections.length === 0){
                        frappe.msgprint(`No Stock Count Sheet selected for ${values.warehouse}`);
                    }
                    frm.doc.stock_sheets = []
                    frm.doc.items = []
                    for (let row in selections) {
                        frm.add_child('stock_sheets', {
                            'stock_sheet': selections[row],
                        })
                    }
        
                    frm.refresh_field('stock_sheets');
        
                    frappe.call('xcount.events.stock_reconciliation.get_items_from_stocksheets', 
                    {
                        stock_sheets : selections, 
                        warehouse: values.warehouse, 
                        make_uncounted_items_zero: frm.doc.make_uncounted_items_zero
                    })
                    .then(r => {
                        for (let row in r.message) {
                            frm.add_child('items', {
                                item_code: r.message[row].item_code,
                                warehouse: r.message[row].warehouse,
                                qty: r.message[row].qty,
                                batch_no: r.message[row].batch_no
                            })
                        }
                        frm.refresh_field('items');
                        cur_dialog.hide();
                    })
                }
            });
        },__("Select Warehouse"), __("Proceed"));
        

        frappe.db.get_list('Stock Sheet', {
            fields: ['name', 'stock_count_date', 'default_warehouse'],
            filters: {
                reconciled: 0,
                docstatus: 1
            }
        }).then(selections => {
            
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