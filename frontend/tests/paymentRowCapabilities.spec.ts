import { describe, expect, it } from "vitest";
import { ref } from "vue";
import { usePaymentUiCapabilities } from "../src/posapp/composables/pos/payments/usePaymentUiCapabilities";

describe("Payment Row Capabilities", () => {
	it("correctly evaluates cashier supervisor permissions", () => {
		const posProfile = ref({});
		const invoiceDoc = ref({});

		const cashierSupervisor = ref({ is_supervisor: 1 });
		const capsSupervisor = usePaymentUiCapabilities({
			posProfile,
			invoiceDoc,
			currentCashier: cashierSupervisor,
		});
		expect(capsSupervisor.isSupervisor.value).toBe(true);

		const cashierNormal = ref({ is_supervisor: 0 });
		const capsNormal = usePaymentUiCapabilities({
			posProfile,
			invoiceDoc,
			currentCashier: cashierNormal,
		});
		expect(capsNormal.isSupervisor.value).toBe(false);
	});
});
