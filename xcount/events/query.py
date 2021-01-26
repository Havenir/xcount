import frappe
import datetime

@frappe.whitelist()
def get_batch_nos(doctype, txt, searchfield, start, page_len, filters):
	return frappe.db.sql("""select batch_id, expiry_date
		from `tabBatch`
		where
			item = {item_code} and disabled = 0 and (expiry_date is null or expiry_date > '{cur_date}')"""
		.format(item_code = frappe.db.escape(filters.get("item")), cur_date = datetime.datetime.today()
		))
