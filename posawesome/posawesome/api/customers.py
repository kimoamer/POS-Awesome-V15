# -*- coding: utf-8 -*-
# Copyright (c) 2020, Youssef Restom and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
from datetime import datetime
import json
import frappe
from frappe.utils import nowdate, flt, cstr, get_datetime
from frappe import _
from erpnext.accounts.doctype.loyalty_program.loyalty_program import (
    get_loyalty_program_details_with_points,
)
from .utils import (
    assert_doctype_permission,
    assert_document_permission,
    fetch_sales_person_names,
    get_pos_request_context,
)
from .stored_value import get_stored_value_summary


def _load_json_arg(value):
    if isinstance(value, str):
        return json.loads(value)
    return value


def _customer_context(
    pos_profile_doc=None,
    company=None,
    pos_opening_shift=None,
    permission_type="read",
):
    return get_pos_request_context(
        pos_profile_doc,
        company=company,
        doctype="Customer",
        permission_type=permission_type,
        require_open_shift=True,
        opening_shift=pos_opening_shift,
    )


def _assert_customer_write_allowed(
    pos_profile_doc=None,
    company=None,
    pos_opening_shift=None,
    permission_type="write",
):
    return _customer_context(
        pos_profile_doc,
        company,
        pos_opening_shift,
        permission_type,
    ).pos_profile


def _validate_customer_access(customer, profile, permission_type="read"):
    customer_name = cstr(customer or "").strip()
    if not customer_name:
        frappe.throw(_("Customer is required."))
    doc = frappe.get_doc("Customer", customer_name)
    assert_document_permission(doc, permission_type)
    allowed_groups = set(get_customer_groups(profile))
    if allowed_groups and doc.get("customer_group") not in allowed_groups:
        frappe.throw(_("Customer is outside this POS Profile."), frappe.PermissionError)
    if doc.get("disabled"):
        frappe.throw(_("Customer is disabled."), frappe.PermissionError)
    return doc


def get_default_non_group_customer_group():
    non_group = frappe.db.get_value("Customer Group", {"is_group": 0}, "name")
    return non_group or "Individual"


def get_default_non_group_territory():
    non_group = frappe.db.get_value("Territory", {"is_group": 0}, "name")
    return non_group or "All Territories"


def get_customer_groups(pos_profile):
    customer_groups = []
    if pos_profile.get("customer_groups"):
        # Get items based on the item groups defined in the POS profile
        for data in pos_profile.get("customer_groups"):
            group_name = data.get("customer_group") if data else None
            if not group_name:
                continue
            customer_groups.extend([d.get("name") for d in get_child_nodes("Customer Group", group_name)])

    return list(set(customer_groups))


def get_child_nodes(group_type, root):
    if not root:
        return []
    result = frappe.db.get_value(group_type, root, ["lft", "rgt"])
    if not result:
        return []
    lft, rgt = result
    return frappe.get_all(
        group_type,
        filters={"lft": [">=", lft], "rgt": ["<=", rgt]},
        fields=["name", "lft", "rgt"],
        order_by="lft",
    )


def get_customer_group_condition(pos_profile):
    cond = "disabled = 0"
    customer_groups = get_customer_groups(pos_profile)
    if customer_groups:
        escaped_groups = [frappe.db.escape(g) for g in customer_groups]
        cond = " customer_group in ({})".format(", ".join(escaped_groups))

    return cond


@frappe.whitelist()
def get_customer_balance(
    customer,
    company=None,
    pos_profile=None,
    pos_opening_shift=None,
):
    if not customer:
        return {"balance": 0, "customer_name": None, "currency": None}
    context = _customer_context(pos_profile, company, pos_opening_shift)
    company = context.company
    customer_doc = _validate_customer_access(customer, context.pos_profile)

    from erpnext.accounts.party import get_dashboard_info

    try:
        customer_name = customer_doc.customer_name

        dashboard_info = get_dashboard_info("Customer", customer)
        company_data = [d for d in dashboard_info if d.get("company") == company]

        if company_data:
            balance = flt(company_data[0].get("total_unpaid", 0))
        else:
            balance = 0

        return {
            "balance": balance,
            "customer_name": customer_name,
            "currency": company_data[0].get("currency") if company_data else None,
        }
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Error fetching customer balance"))
        return {"balance": 0, "customer_name": None, "currency": None}


@frappe.whitelist()
def get_customer_names(
    pos_profile,
    limit=None,
    offset=None,
    start_after=None,
    modified_after=None,
    modified_before=None,
    pos_opening_shift=None,
    search_text=None,
):
    context = _customer_context(pos_profile, pos_opening_shift=pos_opening_shift)
    def _get_customer_names(
        pos_profile,
        limit=None,
        offset=None,
        start_after=None,
        modified_after=None,
        modified_before=None,
        search_text=None,
    ):
        pos_profile = context.pos_profile
        filters = {"disabled": 0}

        customer_groups = get_customer_groups(pos_profile)
        if customer_groups:
            filters["customer_group"] = ["in", customer_groups]

        parsed_modified_after = None
        parsed_modified_before = None
        if modified_after:
            try:
                parsed_modified_after = get_datetime(modified_after)
            except Exception:
                frappe.throw(_("modified_after must be a valid ISO datetime"))
        if modified_before:
            try:
                parsed_modified_before = get_datetime(modified_before)
            except Exception:
                frappe.throw(_("modified_before must be a valid ISO datetime"))
        if parsed_modified_after and parsed_modified_before:
            filters["modified"] = [
                "between",
                [parsed_modified_after.isoformat(), parsed_modified_before.isoformat()],
            ]
        elif parsed_modified_after:
            filters["modified"] = [">", parsed_modified_after.isoformat()]
        elif parsed_modified_before:
            filters["modified"] = ["<=", parsed_modified_before.isoformat()]

        if start_after:
            filters["name"] = [">", start_after]

        normalized_search = cstr(search_text or "").strip()[:140]
        or_filters = None
        if normalized_search:
            search_pattern = f"%{normalized_search}%"
            or_filters = [
                ["Customer", "name", "like", search_pattern],
                ["Customer", "customer_name", "like", search_pattern],
                ["Customer", "mobile_no", "like", search_pattern],
                ["Customer", "email_id", "like", search_pattern],
                ["Customer", "tax_id", "like", search_pattern],
            ]

        resolved_limit = min(max(int(limit or 200), 1), 1000)
        resolved_offset = max(int(offset or 0), 0)
        customers = frappe.get_list(
            "Customer",
            filters=filters,
            or_filters=or_filters,
            fields=[
                "name",
                "modified",
                "mobile_no",
                "email_id",
                "tax_id",
                "customer_name",
                "loyalty_program",
                "default_price_list",
                "customer_group",
                "territory",
                "primary_address",
            ],
            order_by="name",
            limit_start=None if start_after else resolved_offset,
            limit_page_length=resolved_limit,
        )
        return customers

    # Do not cache permission-filtered lists across users assigned to the same
    # profile. Offline sync provides the durable client cache instead.
    return _get_customer_names(
        context.profile_name,
        limit,
        offset,
        start_after,
        modified_after,
        modified_before,
        search_text,
    )


@frappe.whitelist()
def get_customers_count(pos_profile, pos_opening_shift=None):
    context = _customer_context(pos_profile, pos_opening_shift=pos_opening_shift)
    pos_profile = context.pos_profile
    filters = {"disabled": 0}
    customer_groups = get_customer_groups(pos_profile)
    if customer_groups:
        filters["customer_group"] = ["in", customer_groups]
    rows = frappe.get_list(
        "Customer",
        filters=filters,
        fields=["count(name) as count"],
        limit_page_length=1,
    )
    return int((rows[0].get("count") if rows else 0) or 0)


@frappe.whitelist()
def get_customer_info(
    customer=None,
    company=None,
    pos_profile=None,
    pos_opening_shift=None,
):
    customer = cstr(customer or "").strip()
    if not customer:
        return {}

    context = _customer_context(pos_profile, company, pos_opening_shift)
    company = context.company
    customer = _validate_customer_access(customer, context.pos_profile)

    res = {"loyalty_points": None, "conversion_factor": None}

    res["email_id"] = customer.email_id
    res["mobile_no"] = customer.mobile_no
    res["image"] = customer.image
    res["loyalty_program"] = customer.loyalty_program
    res["customer_price_list"] = customer.default_price_list
    res["customer_group"] = customer.customer_group
    res["customer_type"] = customer.customer_type
    res["territory"] = customer.territory
    res["birthday"] = customer.posa_birthday
    res["gender"] = customer.gender
    res["tax_id"] = customer.tax_id
    res["posa_discount"] = customer.posa_discount
    res["name"] = customer.name
    res["customer_name"] = customer.customer_name
    res["customer_group_price_list"] = frappe.get_value(
        "Customer Group", customer.customer_group, "default_price_list"
    )

    effective_price_list = res.get("customer_price_list") or res.get("customer_group_price_list")
    if effective_price_list:
        res["price_list_currency"] = frappe.get_value("Price List", effective_price_list, "currency")
    else:
        res["price_list_currency"] = None

    if customer.loyalty_program:
        lp_details = get_loyalty_program_details_with_points(
            customer.name,
            customer.loyalty_program,
            silent=True,
            include_expired_entry=False,
        )
        res["loyalty_points"] = lp_details.get("loyalty_points")
        res["conversion_factor"] = lp_details.get("conversion_factor")

    # Customer details are needed for every sale. Credit is an optional POS
    # capability, so a disabled credit setting must not make customer selection
    # fail with a permission error.
    res["stored_value_balance"] = 0
    res["stored_value_sources"] = 0
    if context.pos_profile.get("use_customer_credit"):
        stored_value = get_stored_value_summary(
            customer=customer.name,
            company=company,
            pos_profile=context.profile_name,
            opening_shift=context.opening_shift.name,
        )
        res["stored_value_balance"] = stored_value.get("available_amount", 0)
        res["stored_value_sources"] = stored_value.get("source_count", 0)

    addresses = frappe.db.sql(
        """
	SELECT
	    address.name as address_name,
	    address.address_line1,
	    address.address_line2,
	    address.city,
	    address.state,
	    address.country,
	    address.address_type
	FROM `tabAddress` address
	INNER JOIN `tabDynamic Link` link
	    ON (address.name = link.parent)
	WHERE
	    link.link_doctype = 'Customer'
	    AND link.link_name = %s
	    AND address.disabled = 0
	    AND address.address_type = 'Shipping'
	ORDER BY address.creation DESC
	LIMIT 1
	""",
        (customer.name,),
        as_dict=True,
    )

    if addresses:
        addr = addresses[0]
        res["address_line1"] = addr.address_line1 or ""
        res["address_line2"] = addr.address_line2 or ""
        res["city"] = addr.city or ""
        res["state"] = addr.state or ""
        res["country"] = addr.country or ""

    return res


@frappe.whitelist()
def create_customer(
    customer_name,
    company,
    pos_profile_doc,
    customer_id=None,
    tax_id=None,
    mobile_no=None,
    email_id=None,
    referral_code=None,
    birthday=None,
    customer_group=None,
    territory=None,
    customer_type=None,
    gender=None,
    method="create",
    address_line1=None,
    city=None,
    country=None,
    pos_opening_shift=None,
):
    method = cstr(method or "create").strip().lower()
    if method not in {"create", "update"}:
        frappe.throw(_("Unsupported customer operation."))
    context = _customer_context(
        pos_profile_doc,
        company,
        pos_opening_shift,
        "create" if method == "create" else "write",
    )
    company = context.company
    pos_profile = context.pos_profile
    customer_name = cstr(customer_name or "").strip()[:140]
    if not customer_name:
        frappe.throw(_("Customer name is required."))

    # Accept the two formats used by the existing clients without accidentally
    # reversing an already-normalized ISO date.
    formatted_birthday = None
    if birthday:
        birthday_value = cstr(birthday).strip()
        for date_format in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y"):
            try:
                formatted_birthday = datetime.strptime(birthday_value, date_format).date().isoformat()
                break
            except ValueError:
                continue
        if not formatted_birthday:
            frappe.throw(_("Birthday must use YYYY-MM-DD or DD-MM-YYYY format."))
        if formatted_birthday > nowdate():
            frappe.throw(_("Birthday cannot be in the future."))

    if method == "create":
        is_exist = frappe.db.exists("Customer", {"customer_name": customer_name})
        if pos_profile.get("posa_allow_duplicate_customer_names") or not is_exist:
            customer = frappe.get_doc(
                {
                    "doctype": "Customer",
                    "customer_name": customer_name,
                    "posa_referral_company": company,
                    "tax_id": tax_id,
                    "mobile_no": mobile_no,
                    "email_id": email_id,
                    "posa_referral_code": referral_code,
                    "posa_birthday": formatted_birthday,
                    "customer_type": customer_type,
                    "gender": gender,
                }
            )
            if customer_group and not frappe.db.get_value("Customer Group", customer_group, "is_group"):
                _validate_customer_group(customer_group, pos_profile)
                customer.customer_group = customer_group
            else:
                customer.customer_group = _default_customer_group(pos_profile)

            if territory and not frappe.db.get_value("Territory", territory, "is_group"):
                customer.territory = territory
            else:
                customer.territory = get_default_non_group_territory()

            customer.insert()

            if address_line1 or city:
                args = {
                    "name": f"{customer.customer_name} - Shipping",
                    "doctype": "Customer",
                    "customer": customer.name,
                    "address_line1": address_line1 or "",
                    "address_line2": "",
                    "city": city or "",
                    "state": "",
                    "pincode": "",
                    "country": country or "",
                    "company": company,
                    "pos_profile_doc": pos_profile_doc,
                    "pos_opening_shift": context.opening_shift.name,
                }
                make_address(json.dumps(args))

            return customer
        else:
            # Treat create as idempotent when duplicate names are disabled. The
            # returned existing customer is still checked against document and
            # POS Profile permissions before it can be selected by the client.
            existing_customer = _validate_customer_access(is_exist, pos_profile)
            existing_payload = existing_customer.as_dict()
            existing_payload["already_exists"] = True
            return existing_payload

    elif method == "update":
        customer_doc = _validate_customer_access(customer_id, pos_profile, "write")
        customer_doc.customer_name = customer_name
        customer_doc.tax_id = tax_id
        customer_doc.mobile_no = mobile_no
        customer_doc.email_id = email_id
        customer_doc.posa_referral_code = referral_code
        customer_doc.posa_birthday = formatted_birthday
        customer_doc.customer_type = customer_type
        customer_doc.gender = gender
        if customer_group and not frappe.db.get_value("Customer Group", customer_group, "is_group"):
            _validate_customer_group(customer_group, pos_profile)
            customer_doc.customer_group = customer_group
        if territory and not frappe.db.get_value("Territory", territory, "is_group"):
            customer_doc.territory = territory
        customer_doc.save()

        # ensure contact details are synced correctly
        if mobile_no:
            set_customer_info(
                customer_doc.name,
                "mobile_no",
                mobile_no,
                pos_profile_doc=pos_profile_doc,
                company=company,
                pos_opening_shift=context.opening_shift.name,
            )
        if email_id:
            set_customer_info(
                customer_doc.name,
                "email_id",
                email_id,
                pos_profile_doc=pos_profile_doc,
                company=company,
                pos_opening_shift=context.opening_shift.name,
            )

        existing_address_name = frappe.db.get_value(
            "Dynamic Link",
            {
                "link_doctype": "Customer",
                "link_name": customer_id,
                "parenttype": "Address",
            },
            "parent",
        )

        if existing_address_name:
            address_doc = frappe.get_doc("Address", existing_address_name)
            assert_document_permission(address_doc, "write")
            address_doc.address_line1 = address_line1 or ""
            address_doc.city = city or ""
            address_doc.country = country or ""
            address_doc.save()
        else:
            if address_line1 or city:
                args = {
                    "name": f"{customer_doc.customer_name} - Shipping",
                    "doctype": "Customer",
                    "customer": customer_doc.name,
                    "address_line1": address_line1 or "",
                    "address_line2": "",
                    "city": city or "",
                    "state": "",
                    "pincode": "",
                    "country": country or "",
                    "company": company,
                    "pos_profile_doc": pos_profile_doc,
                    "pos_opening_shift": context.opening_shift.name,
                }
                make_address(json.dumps(args))

        return customer_doc


@frappe.whitelist()
def set_customer_info(
    customer,
    fieldname,
    value="",
    pos_profile_doc=None,
    company=None,
    pos_opening_shift=None,
):
    context = _customer_context(
        pos_profile_doc,
        company,
        pos_opening_shift,
        "write",
    )
    customer_doc = _validate_customer_access(customer, context.pos_profile, "write")
    fieldname = cstr(fieldname or "")
    if fieldname not in {"loyalty_program", "email_id", "mobile_no"}:
        frappe.throw(_("This customer field cannot be updated from POS."))

    if fieldname == "loyalty_program":
        customer_doc.loyalty_program = value or None
        customer_doc.save()

    contact = frappe.get_cached_value("Customer", customer, "customer_primary_contact") or ""

    if contact:
        contact_doc = frappe.get_doc("Contact", contact)
        assert_document_permission(contact_doc, "write")
        if fieldname == "email_id":
            contact_doc.set("email_ids", [{"email_id": value, "is_primary": 1}])
            customer_doc.email_id = value
        elif fieldname == "mobile_no":
            contact_doc.set("phone_nos", [{"phone": value, "is_primary_mobile_no": 1}])
            customer_doc.mobile_no = value
        contact_doc.save()
        customer_doc.save()

    else:
        contact_doc = frappe.new_doc("Contact")
        contact_doc.first_name = customer
        contact_doc.is_primary_contact = 1
        contact_doc.is_billing_contact = 1
        if fieldname == "mobile_no":
            contact_doc.add_phone(value, is_primary_mobile_no=1, is_primary_phone=1)

        if fieldname == "email_id":
            contact_doc.add_email(value, is_primary=1)

        contact_doc.append("links", {"link_doctype": "Customer", "link_name": customer})

        contact_doc.flags.ignore_mandatory = True
        assert_doctype_permission("Contact", "create")
        contact_doc.save()
        customer_doc.customer_primary_contact = contact_doc.name
        if fieldname == "email_id":
            customer_doc.email_id = value
        elif fieldname == "mobile_no":
            customer_doc.mobile_no = value
        customer_doc.save()


@frappe.whitelist()
def get_customer_addresses(customer, pos_profile=None, pos_opening_shift=None):
    context = _customer_context(pos_profile, pos_opening_shift=pos_opening_shift)
    _validate_customer_access(customer, context.pos_profile)
    rows = frappe.db.sql(
        """
        SELECT
            address.name,
            address.address_line1,
            address.address_line2,
            address.address_title,
            address.city,
            address.state,
            address.country,
            address.address_type
        FROM `tabAddress` as address
        INNER JOIN `tabDynamic Link` AS link
                                ON address.name = link.parent
        WHERE link.link_doctype = 'Customer'
            AND link.link_name = %s
            AND address.disabled = 0
        ORDER BY address.name
        """,
        (customer,),
        as_dict=1,
    )
    allowed = []
    for row in rows:
        address_doc = frappe.get_doc("Address", row.get("name"))
        assert_document_permission(address_doc, "read")
        allowed.append(row)
    return allowed


@frappe.whitelist()
def make_address(args):
    args = _load_json_arg(args)
    context = _customer_context(
        args.get("pos_profile_doc") or args.get("pos_profile"),
        args.get("company"),
        args.get("pos_opening_shift"),
    )
    assert_doctype_permission("Address", "create")
    customer_doc = _validate_customer_access(
        args.get("customer"),
        context.pos_profile,
    )
    if args.get("doctype") not in (None, "", "Customer"):
        frappe.throw(_("Only customer shipping addresses can be created from POS."))

    address = frappe.get_doc(
        {
            "doctype": "Address",
            "address_title": cstr(args.get("name") or customer_doc.customer_name).strip()[:140],
            "address_line1": args.get("address_line1"),
            "address_line2": args.get("address_line2"),
            "city": args.get("city"),
            "state": args.get("state"),
            "pincode": args.get("pincode"),
            "country": args.get("country"),
            "address_type": "Shipping",
            "links": [{"link_doctype": "Customer", "link_name": customer_doc.name}],
        }
    ).insert()

    return address


@frappe.whitelist()
def get_sales_person_names(pos_profile=None):
    return fetch_sales_person_names(pos_profile=pos_profile)


def _validate_customer_group(customer_group, profile):
    allowed_groups = set(get_customer_groups(profile))
    if allowed_groups and customer_group not in allowed_groups:
        frappe.throw(_("Customer Group is outside this POS Profile."), frappe.PermissionError)
    return customer_group


def _default_customer_group(profile):
    allowed_groups = sorted(get_customer_groups(profile))
    if allowed_groups:
        for group in allowed_groups:
            if not frappe.db.get_value("Customer Group", group, "is_group"):
                return group
        frappe.throw(_("POS Profile does not contain an assignable Customer Group."))
    return get_default_non_group_customer_group()
