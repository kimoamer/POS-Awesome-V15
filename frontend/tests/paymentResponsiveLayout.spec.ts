import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
// @ts-ignore
import PaymentSectionShell from "../src/posapp/components/pos/payments/PaymentSectionShell.vue";
// @ts-ignore
import PaymentActionButtons from "../src/posapp/components/pos/payments/PaymentActionButtons.vue";
// @ts-ignore
import Navbar from "../src/posapp/components/Navbar.vue";
// @ts-ignore
import { useUIStore } from "../src/posapp/stores/uiStore";

describe("Payment Responsive Layout & Visual System Contract", () => {
	it("renders tonal icon box container in PaymentSectionShell", () => {
		const wrapper = mount(PaymentSectionShell, {
			props: {
				title: "Payment Methods",
				icon: "mdi-wallet-outline",
			},
		});

		const iconBox = wrapper.find(".payment-section-shell__icon-box");
		expect(iconBox.exists()).toBe(true);
		expect(wrapper.text()).toContain("Payment Methods");
	});

	it("renders phone mode action footer with More button without payment-footer-btn class", () => {
		const wrapper = mount(PaymentActionButtons, {
			props: {
				viewportMode: "phone",
				loading: false,
				validatePayment: false,
			},
		});

		expect(wrapper.classes()).toContain("payment-action-buttons--phone");
		const moreBtn = wrapper.find(".payment-more-btn");
		expect(moreBtn.exists()).toBe(true);
		expect(moreBtn.classes()).not.toContain("payment-footer-btn");

		const cancelBtn = wrapper.find(".payment-cancel-btn");
		expect(cancelBtn.exists()).toBe(true);
	});

	it("renders desktop action footer with 3 direct buttons on desktop viewportMode", () => {
		const wrapper = mount(PaymentActionButtons, {
			props: {
				viewportMode: "desktop",
				loading: false,
				validatePayment: false,
			},
		});

		const buttons = wrapper.findAll(".payment-footer-btn");
		expect(buttons.length).toBe(3);
		expect(wrapper.text()).toContain("Submit & Print");
	});

	it("unmounts root nav element in Navbar.vue when activeView is payment on mobile", async () => {
		const pinia = createPinia();
		setActivePinia(pinia);

		const uiStore = useUIStore();
		uiStore.activeView = "payment";

		const wrapper = mount(Navbar, {
			global: {
				plugins: [pinia],
				stubs: {
					NavbarAppBar: true,
					NavbarDrawer: true,
					NavbarMenu: true,
					NavbarSettingsPanel: true,
					NotificationBell: true,
					OfflineStatusPanel: true,
					StatusIndicator: true,
					CacheUsageMeter: true,
					AboutDialog: true,
					EmployeeSwitchDialog: true,
					OfflineInvoicesDialog: true,
					ServerUsageGadget: true,
					DatabaseUsageGadget: true,
				},
			},
		});

		// Window innerWidth simulated for test environment
		Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 390 });
		window.dispatchEvent(new Event("resize"));

		// Verify nav tag is unmounted during payment
		const navTag = wrapper.find("nav");
		expect(navTag.exists()).toBe(false);

		// Switch back to pos/items view
		uiStore.activeView = "pos";
		await wrapper.vm.$nextTick();
	});
});
