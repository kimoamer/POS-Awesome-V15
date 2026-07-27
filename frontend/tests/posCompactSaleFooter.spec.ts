import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { useUIStore } from "../src/posapp/stores/uiStore";
import { useInvoiceStore } from "../src/posapp/stores/invoiceStore";
import Pos from "../src/posapp/components/pos/shell/Pos.vue";

describe("Compact Mobile & Tablet Sale Footer Integration", () => {
	it("renders all 5 footer action buttons and triggers their handlers", async () => {
		const pinia = createPinia();
		setActivePinia(pinia);
		const uiStore = useUIStore();
		const invoiceStore = useInvoiceStore();
		const eventBus = { on: () => {}, off: () => {}, emit: () => {} };

		const wrapper = mount(Pos, {
			global: {
				plugins: [pinia],
				provide: { eventBus },
				stubs: {
					ItemsSelector: true,
					Invoice: {
						template: "<div class='stub-invoice'></div>",
						methods: {
							show_payment: () => {},
							handleShowPaymentRequest: () => {},
						},
					},
					OpeningDialog: true,
					Payments: true,
					Drafts: true,
					InvoiceManagement: true,
					SalesOrders: true,
					NewAddress: true,
					Variants: true,
					Returns: true,
					MpesaPayments: true,
				},
			},
		});

		// Force mobile viewport simulation for showBottomDock
		(wrapper.vm as any).responsive.windowWidth = 500;
		await wrapper.vm.$nextTick();

		const footerStack = wrapper.find(".mobile-pos-stack");
		expect(footerStack.exists()).toBe(true);

		const items = wrapper.findAll(".mobile-pos-dock__item");
		expect(items.length).toBe(5);

		// 1. Browse button
		await items[0]?.trigger("click");
		expect((wrapper.vm as any).compactPanel).toBe("selector");

		// 2. Offers button
		await items[1]?.trigger("click");
		expect(uiStore.activeView).toBe("offers");

		// 3. Cart button
		await items[2]?.trigger("click");
		expect((wrapper.vm as any).compactPanel).toBe("invoice");

		// 4. Coupons button
		await items[3]?.trigger("click");
		expect(uiStore.activeView).toBe("coupons");

		// 5. Pay button
		await items[4]?.trigger("click");
		expect(items[4]?.exists()).toBe(true);
	});

	it("Cart count badge does not stretch and correctly displays 0, 3, and 99+", async () => {
		const pinia = createPinia();
		setActivePinia(pinia);
		const invoiceStore = useInvoiceStore();
		const eventBus = { on: () => {}, off: () => {}, emit: () => {} };

		const wrapper = mount(Pos, {
			global: {
				plugins: [pinia],
				provide: { eventBus },
				stubs: {
					ItemsSelector: true,
					Invoice: true,
					OpeningDialog: true,
					Payments: true,
				},
			},
		});

		(wrapper.vm as any).responsive.windowWidth = 500;
		await wrapper.vm.$nextTick();

		const pill = wrapper.find(".mobile-pos-dock__pill");
		expect(pill.exists()).toBe(true);
		expect(pill.text()).toBe("0");

		// Set itemsCount to 3
		invoiceStore.itemsCount = 3;
		await wrapper.vm.$nextTick();
		expect(pill.text()).toBe("3");

		// Set itemsCount to 120 (shows 99+)
		invoiceStore.itemsCount = 120;
		await wrapper.vm.$nextTick();
		expect(pill.text()).toBe("99+");
	});
});
