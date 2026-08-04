<template>
	<v-dialog
		:model-value="switchDialogOpen"
		max-width="520"
		scrollable
		@update:model-value="handleSwitchDialog"
	>
		<v-card class="pos-themed-card employee-switch-dialog" variant="flat">
			<v-card-title class="employee-switch-dialog__title">
				<div>
					<div class="employee-switch-dialog__eyebrow">{{ __("Shared terminal") }}</div>
					<div class="text-h6 font-weight-bold text-primary">{{ __("Switch Cashier") }}</div>
				</div>
				<v-btn
					icon="mdi-close"
					variant="text"
					density="compact"
					:aria-label="__('Close cashier switcher')"
					@click="employeeStore.closeEmployeeSwitch()"
				/>
			</v-card-title>

			<v-card-text class="employee-switch-dialog__body">
				<div class="employee-switch-dialog__copy">
					{{ __("Choose the cashier currently operating this terminal.") }}
				</div>
				<div v-if="!terminalEmployees.length" class="employee-switch-dialog__empty">
					{{ __("No cashier profiles are available for this POS profile yet.") }}
				</div>
				<div v-else class="employee-switch-dialog__list">
					<button
						v-for="employee in terminalEmployees"
						:key="employee.user"
						type="button"
						:data-test="`employee-option-${employee.user}`"
						class="employee-switch-dialog__option"
						:class="{ 'employee-switch-dialog__option--active': selectedUser === employee.user }"
						@click="selectEmployee(employee.user)"
					>
						<div>
							<strong class="employee-switch-dialog__name">{{ employee.full_name }}</strong>
							<div class="employee-switch-dialog__meta">{{ employee.user }}</div>
						</div>
						<v-icon
							icon="mdi-check-circle"
							color="primary"
							size="22"
							v-if="selectedUser === employee.user"
						/>
					</button>
				</div>
				<v-alert
					variant="tonal"
					type="info"
					density="comfortable"
					class="employee-switch-dialog__help"
					data-test="cashier-pin-help"
				>
					{{
						__(
							"Set each cashier PIN in the User form and keep terminal members assigned in POS Profile User.",
						)
					}}
				</v-alert>
				<v-text-field
					v-model="cashierPin"
					:type="showPin ? 'text' : 'password'"
					:append-inner-icon="showPin ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
					variant="outlined"
					density="comfortable"
					hide-details="auto"
					color="primary"
					class="pos-themed-input mt-3"
					:label="__('Cashier PIN')"
					:data-test="'cashier-pin-input'"
					@click:append-inner="showPin = !showPin"
					@keyup.enter="submitSwitch"
				/>
				<v-alert
					v-if="pinError"
					variant="tonal"
					type="error"
					density="comfortable"
					class="employee-switch-dialog__error mt-3"
					data-test="cashier-pin-error"
				>
					{{ pinError }}
				</v-alert>
			</v-card-text>

			<v-card-actions class="employee-switch-dialog__actions">
				<v-btn variant="text" color="secondary" @click="employeeStore.closeEmployeeSwitch()">
					{{ __("Cancel") }}
				</v-btn>
				<v-btn
					color="primary"
					variant="text"
					class="font-weight-bold"
					:disabled="!canSubmit"
					:loading="isSubmitting"
					data-test="cashier-pin-submit"
					@click="submitSwitch"
				>
					{{ __("Use Cashier") }}
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>

	<v-dialog :model-value="lockDialogOpen" max-width="480" persistent>
		<v-card class="pos-themed-card employee-switch-dialog" variant="flat">
			<v-card-title class="employee-switch-dialog__title">
				<div>
					<div class="employee-switch-dialog__eyebrow">{{ __("Terminal locked") }}</div>
					<div class="text-h6 font-weight-bold text-primary">{{ __("Unlock POS") }}</div>
				</div>
			</v-card-title>

			<v-card-text class="employee-switch-dialog__body">
				<div class="employee-switch-dialog__copy">
					{{ __("Select the cashier who is taking over this terminal.") }}
				</div>
				<div class="employee-switch-dialog__list">
					<button
						v-for="employee in terminalEmployees"
						:key="`unlock-${employee.user}`"
						type="button"
						class="employee-switch-dialog__option"
						:class="{ 'employee-switch-dialog__option--active': selectedUser === employee.user }"
						@click="selectEmployee(employee.user)"
					>
						<div>
							<strong class="employee-switch-dialog__name">{{ employee.full_name }}</strong>
							<div class="employee-switch-dialog__meta">{{ employee.user }}</div>
						</div>
						<v-icon icon="mdi-lock-open-outline" color="primary" size="22" />
					</button>
				</div>
				<v-alert
					variant="tonal"
					type="info"
					density="comfortable"
					class="employee-switch-dialog__help"
				>
					{{
						__(
							"Set each cashier PIN in the User form and keep terminal members assigned in POS Profile User.",
						)
					}}
				</v-alert>
				<v-text-field
					v-model="cashierPin"
					:type="showPin ? 'text' : 'password'"
					:append-inner-icon="showPin ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
					variant="outlined"
					density="comfortable"
					hide-details="auto"
					color="primary"
					class="pos-themed-input mt-3"
					:label="__('Cashier PIN')"
					@click:append-inner="showPin = !showPin"
					@keyup.enter="submitUnlock"
				/>
				<v-alert
					v-if="pinError"
					variant="tonal"
					type="error"
					density="comfortable"
					class="employee-switch-dialog__error mt-3"
				>
					{{ pinError }}
				</v-alert>
			</v-card-text>

			<v-card-actions class="employee-switch-dialog__actions">
				<v-btn
					color="primary"
					variant="text"
					class="font-weight-bold"
					:disabled="!canSubmit"
					:loading="isSubmitting"
					@click="submitUnlock"
				>
					{{ __("Unlock POS") }}
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useEmployeeStore } from "../../../stores/employeeStore";
import { useUIStore } from "../../../stores/uiStore";

const employeeStore = useEmployeeStore();
const uiStore = useUIStore();
const { terminalEmployees, currentCashier, switchDialogOpen, lockDialogOpen } = storeToRefs(employeeStore);
const selectedUser = ref("");
const cashierPin = ref("");
const pinError = ref("");
const isSubmitting = ref(false);
const showPin = ref(false);
const posProfileName = computed(
	() => uiStore.posProfile?.name || window.frappe?.boot?.pos_profile?.name || "",
);

watch(
	[currentCashier, switchDialogOpen, lockDialogOpen, terminalEmployees],
	([cashier, switchOpen, lockOpen]) => {
		if (switchOpen || lockOpen) {
			selectedUser.value = cashier?.user || terminalEmployees.value[0]?.user || "";
			cashierPin.value = "";
			pinError.value = "";
			showPin.value = false;
		}
	},
	{ immediate: true },
);

const selectedCashier = computed(
	() => terminalEmployees.value.find((employee) => employee.user === selectedUser.value) || null,
);

const canSubmit = computed(
	() => Boolean(selectedCashier.value?.user) && Boolean(cashierPin.value.trim()) && !isSubmitting.value,
);

const normalizeErrorMessage = (error) =>
	error?.message || error?.exc || error?.messages?.[0] || __("Unable to verify cashier PIN.");

const selectEmployee = (user) => {
	selectedUser.value = user;
	pinError.value = "";
};

const handleSwitchDialog = (value) => {
	if (!value) {
		employeeStore.closeEmployeeSwitch();
	}
};

const verifySelection = async () => {
	if (!selectedCashier.value) {
		pinError.value = __("Select a cashier first.");
		return null;
	}
	if (!cashierPin.value.trim()) {
		pinError.value = __("Enter the cashier PIN to continue.");
		return null;
	}

	isSubmitting.value = true;
	pinError.value = "";

	try {
		const response = await window.frappe.call({
			method: "posawesome.posawesome.api.employees.verify_terminal_employee_pin",
			args: {
				pos_profile: posProfileName.value,
				user: selectedCashier.value.user,
				pin: cashierPin.value.trim(),
			},
		});
		return {
			...selectedCashier.value,
			...(response?.message || {}),
		};
	} catch (error) {
		pinError.value = normalizeErrorMessage(error);
		return null;
	} finally {
		isSubmitting.value = false;
	}
};

const submitSwitch = async () => {
	const verifiedCashier = await verifySelection();
	if (!verifiedCashier) return;
	employeeStore.setCurrentCashier(verifiedCashier);
	employeeStore.closeEmployeeSwitch();
	cashierPin.value = "";
};

const submitUnlock = async () => {
	const verifiedCashier = await verifySelection();
	if (!verifiedCashier) return;
	employeeStore.unlockTerminal(verifiedCashier);
	cashierPin.value = "";
};

const __ = window.__;
</script>

<style scoped>
.employee-switch-dialog {
	border-radius: var(--pos-radius-lg, 20px) !important;
	background: var(--pos-surface-raised, #ffffff) !important;
	border: 1px solid var(--pos-border-light, #e2e8f0) !important;
	box-shadow: var(--pos-shadow-lg, 0 16px 40px rgba(15, 23, 42, 0.14)) !important;
	overflow: hidden;
}

.employee-switch-dialog__title {
	padding: 20px 24px 12px;
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 16px;
}

.employee-switch-dialog__eyebrow {
	font-size: 0.72rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	color: var(--pos-text-secondary, #64748b);
}

.employee-switch-dialog__body {
	padding: 0 24px 16px;
}

.employee-switch-dialog__copy {
	font-size: 0.88rem;
	color: var(--pos-text-secondary, #64748b);
	margin-bottom: 14px;
}

.employee-switch-dialog__empty {
	padding: 16px;
	border: 1px dashed var(--pos-border-light, #cbd5e1);
	border-radius: 14px;
	color: var(--pos-text-secondary, #64748b);
}

.employee-switch-dialog__list {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.employee-switch-dialog__option {
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 14px 18px;
	border-radius: 16px;
	border: 1.5px solid var(--pos-border-light, #e2e8f0);
	background: var(--pos-surface-raised, #ffffff);
	color: var(--pos-text-primary, #0f172a);
	text-align: left;
	cursor: pointer;
	transition: all 0.18s ease;
}

.employee-switch-dialog__option:hover {
	transform: translateY(-1px);
	border-color: var(--pos-primary, #2563eb);
	box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
}

.employee-switch-dialog__option--active {
	border-color: var(--pos-primary, #2563eb) !important;
	background: color-mix(in srgb, var(--pos-primary, #2563eb) 6%, transparent) !important;
	box-shadow: 0 4px 14px color-mix(in srgb, var(--pos-primary, #2563eb) 12%, transparent);
}

.employee-switch-dialog__name {
	font-size: 0.95rem;
	font-weight: 700;
	color: var(--pos-text-primary, #0f172a);
}

.employee-switch-dialog__meta {
	margin-top: 2px;
	font-size: 0.82rem;
	color: var(--pos-text-secondary, #64748b);
}

.employee-switch-dialog__help {
	margin: 16px 0 12px;
	border-radius: 14px;
	font-size: 0.82rem;
	line-height: 1.45;
}

.employee-switch-dialog__error {
	margin-top: 12px;
	border-radius: 14px;
}

.employee-switch-dialog__actions {
	padding: 12px 24px 20px;
	display: flex;
	justify-content: flex-end;
	gap: 8px;
}
</style>
