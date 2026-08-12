<template>
	<v-row justify="center">
		<v-dialog
			v-model="isUpdateCustomerDialogOpen"
			max-width="640px"
			persistent
			scrollable
			@keydown.esc.capture.stop.prevent="handleDialogEscape"
		>
			<v-card class="update-customer-dialog-card pos-themed-card">
				<!-- Header -->
				<div class="dialog-header px-5 py-4 d-flex align-center justify-space-between">
					<div class="d-flex align-center gap-3">
						<div class="dialog-header-icon-wrap">
							<v-icon color="primary" size="22">
								{{ customer_id ? 'mdi-account-edit-outline' : 'mdi-account-plus-outline' }}
							</v-icon>
						</div>
						<div>
							<h3 class="dialog-title text-subtitle-1 font-weight-bold mb-0">
								{{ customer_id ? __("Update Customer") : __("Create Customer") }}
							</h3>
							<p class="dialog-subtitle text-caption text-secondary mb-0">
								{{ customer_id ? __("Edit customer information") : __("Add a new customer to your database") }}
							</p>
						</div>
					</div>

					<div class="d-flex align-center gap-3">
						<v-switch
							v-model="hideNonEssential"
							density="compact"
							hide-details
							color="primary"
							class="hide-non-essential-switch"
							:label="__('Hide Non Essential Fields')"
						/>
						<v-btn
							icon="mdi-close"
							variant="text"
							density="compact"
							size="small"
							class="close-btn"
							@click="confirm_close"
							:aria-label="__('Close Dialog')"
						/>
					</div>
				</div>

				<v-divider class="border-opacity-10" />

				<!-- Form Content -->
				<v-card-text class="dialog-body px-5 py-4">
					<v-row density="comfortable">
						<!-- Customer Name -->
						<v-col cols="12">
							<v-text-field
								ref="customerNameField"
								density="compact"
								variant="outlined"
								color="primary"
								:label="frappe._('Customer Name') + ' *'"
								prepend-inner-icon="mdi-account-outline"
								hide-details="auto"
								class="pos-themed-input"
								v-model="customer_name"
							/>
						</v-col>

						<!-- Tax ID -->
						<v-col cols="12" sm="6">
							<v-text-field
								density="compact"
								variant="outlined"
								color="primary"
								:label="frappe._('Tax ID')"
								prepend-inner-icon="mdi-card-text-outline"
								class="pos-themed-input"
								hide-details="auto"
								v-model="tax_id"
							/>
						</v-col>

						<!-- Mobile No -->
						<v-col cols="12" sm="6">
							<v-text-field
								density="compact"
								variant="outlined"
								color="primary"
								:label="frappe._('Mobile No')"
								prepend-inner-icon="mdi-phone-outline"
								class="pos-themed-input"
								hide-details="auto"
								v-model="mobile_no"
							/>
						</v-col>

						<!-- Address Line 1 -->
						<v-col cols="12" v-if="!hideNonEssential">
							<v-text-field
								density="compact"
								variant="outlined"
								color="primary"
								:label="__('Address Line 1')"
								prepend-inner-icon="mdi-map-marker-outline"
								hide-details="auto"
								class="pos-themed-input"
								v-model="address_line1"
							/>
						</v-col>

						<!-- City -->
						<v-col cols="12" sm="6" v-if="!hideNonEssential">
							<v-text-field
								v-model="city"
								variant="outlined"
								density="compact"
								color="primary"
								prepend-inner-icon="mdi-city-variant-outline"
								:label="__('City')"
								hide-details="auto"
								class="pos-themed-input"
							/>
						</v-col>

						<!-- Country -->
						<v-col cols="12" sm="6" v-if="!hideNonEssential">
							<v-select
								v-model="country"
								:items="countries"
								variant="outlined"
								density="compact"
								color="primary"
								prepend-inner-icon="mdi-earth"
								:label="__('Country')"
								hide-details="auto"
								class="pos-themed-input"
							/>
						</v-col>

						<!-- Email Id -->
						<v-col cols="12" sm="6">
							<v-text-field
								density="compact"
								variant="outlined"
								color="primary"
								:label="frappe._('Email Id')"
								prepend-inner-icon="mdi-email-outline"
								class="pos-themed-input"
								hide-details="auto"
								v-model="email_id"
							/>
						</v-col>

						<!-- Gender -->
						<v-col cols="12" sm="6">
							<v-select
								density="compact"
								variant="outlined"
								color="primary"
								:label="__('Gender')"
								prepend-inner-icon="mdi-gender-male-female"
								:items="genders"
								v-model="gender"
								hide-details="auto"
								class="pos-themed-input"
							/>
						</v-col>

						<!-- Referral Code -->
						<v-col cols="12" sm="6">
							<v-text-field
								density="compact"
								variant="outlined"
								color="primary"
								:label="frappe._('Referral Code')"
								prepend-inner-icon="mdi-ticket-percent-outline"
								class="pos-themed-input"
								hide-details="auto"
								v-model="referral_code"
							/>
						</v-col>

						<!-- Birthday -->
						<v-col cols="12" sm="6">
							<v-text-field
								v-model="birthday"
								:label="frappe._('Birthday (DD-MM-YYYY)')"
								density="compact"
								variant="outlined"
								clearable
								hide-details="auto"
								color="primary"
								prepend-inner-icon="mdi-cake-variant-outline"
								placeholder="DD-MM-YYYY"
								@update:model-value="formatBirthdayOnInput"
								class="pos-themed-input"
							/>
						</v-col>

						<!-- Customer Group -->
						<v-col cols="12" sm="6" v-if="!hideNonEssential">
							<v-autocomplete
								clearable
								density="compact"
								variant="outlined"
								auto-select-first
								color="primary"
								prepend-inner-icon="mdi-account-group-outline"
								:label="frappe._('Customer Group') + ' *'"
								v-model="group"
								:items="groups"
								class="pos-themed-input"
								:no-data-text="__('Group not found')"
								hide-details="auto"
								required
							/>
						</v-col>

						<!-- Territory -->
						<v-col cols="12" sm="6" v-if="!hideNonEssential">
							<v-autocomplete
								clearable
								density="compact"
								variant="outlined"
								auto-select-first
								color="primary"
								prepend-inner-icon="mdi-map-outline"
								:label="frappe._('Territory') + ' *'"
								v-model="territory"
								:items="territorys"
								class="pos-themed-input"
								:no-data-text="__('Territory not found')"
								hide-details="auto"
								required
							/>
						</v-col>

						<!-- Loyalty Program -->
						<v-col cols="12" sm="6" v-if="loyalty_program">
							<v-text-field
								v-model="loyalty_program"
								:label="frappe._('Loyalty Program')"
								density="compact"
								variant="outlined"
								prepend-inner-icon="mdi-star-outline"
								readonly
								hide-details="auto"
								class="pos-themed-input"
							/>
						</v-col>

						<!-- Loyalty Points -->
						<v-col cols="12" sm="6" v-if="loyalty_points">
							<v-text-field
								v-model="loyalty_points"
								:label="frappe._('Loyalty Points')"
								density="compact"
								variant="outlined"
								prepend-inner-icon="mdi-piggy-bank-outline"
								readonly
								hide-details="auto"
								class="pos-themed-input"
							/>
						</v-col>
					</v-row>
				</v-card-text>

				<v-divider class="border-opacity-10" />

				<!-- Footer -->
				<div class="dialog-footer px-5 py-3 d-flex align-center justify-end gap-2">
					<v-btn
						variant="tonal"
						color="secondary"
						class="action-btn px-4"
						rounded="lg"
						@click="confirm_close"
					>
						{{ __("Close") }}
					</v-btn>
					<v-btn
						color="primary"
						variant="flat"
						class="action-btn px-5"
						rounded="lg"
						prepend-icon="mdi-check"
						@click="submit_dialog"
					>
						{{ __("Submit") }}
					</v-btn>
				</div>
			</v-card>
		</v-dialog>

		<!-- Confirmation Dialog -->
		<v-dialog
			v-model="confirmDialog"
			max-width="440px"
			@keydown.esc.capture.stop.prevent="handleConfirmEscape"
		>
			<v-card class="confirm-dialog-card pos-themed-card">
				<div class="dialog-header px-5 py-4 d-flex align-center gap-3">
					<div class="confirm-icon-wrap">
						<v-icon color="warning" size="24">mdi-alert-circle-outline</v-icon>
					</div>
					<div>
						<h3 class="dialog-title text-subtitle-1 font-weight-bold mb-0">
							{{ __("Confirm Close") }}
						</h3>
						<p class="dialog-subtitle text-caption text-secondary mb-0">
							{{ __("Unsaved changes will be lost") }}
						</p>
					</div>
				</div>
				<v-divider class="border-opacity-10" />
				<v-card-text class="px-5 py-4 text-body-2 text-secondary">
					{{ __("Are you sure you want to close? All entered data will be lost.") }}
				</v-card-text>
				<v-divider class="border-opacity-10" />
				<div class="dialog-footer px-5 py-3 d-flex align-center justify-end gap-2">
					<v-btn
						variant="tonal"
						color="secondary"
						rounded="lg"
						class="action-btn px-4"
						@click="confirmDialog = false"
					>
						{{ __("Continue Editing") }}
					</v-btn>
					<v-btn
						color="error"
						variant="flat"
						rounded="lg"
						class="action-btn px-4"
						prepend-icon="mdi-trash-can-outline"
						@click="confirmClose"
					>
						{{ __("Discard Changes") }}
					</v-btn>
				</div>
			</v-card>
		</v-dialog>
	</v-row>
</template>

<script>
import { isOffline, saveOfflineCustomer } from "../../../../../offline/index";
import { useCustomersStore } from "../../../../stores/customersStore";
import { useUIStore } from "../../../../stores/uiStore";
import { storeToRefs } from "pinia";
import { useToastStore } from "../../../../stores/toastStore";

export default {
	setup() {
		const customersStore = useCustomersStore();
		const uiStore = useUIStore();
		const toastStore = useToastStore();
		const { selectedCustomer, isUpdateCustomerDialogOpen, customerToUpdate } =
			storeToRefs(customersStore);
		return {
			selectedCustomer,
			uiStore,
			toastStore,
			isUpdateCustomerDialogOpen,
			customerToUpdate,
			customersStore,
		};
	},
	data: () => ({
		// customerDialog: false, // Moved to store
		confirmDialog: false,
		pos_profile: "",
		customer_id: "",
		customer_name: "",
		tax_id: "",
		mobile_no: "",
		address_line1: "",
		city: "",
		country: "Pakistan",
		email_id: "",
		referral_code: "",
		birthday: "",
		birthday_menu: false,
		group: "",
		groups: [],
		territory: "",
		territorys: [],
		genders: [],
		customer_type: "Individual",
		gender: "",
		loyalty_points: null,
		loyalty_program: null,
		hideNonEssential: false,
		countries: [
			"Afghanistan",
			"Australia",
			"Bahrain",
			"Bangladesh",
			"Canada",
			"China",
			"Denmark",
			"France",
			"Germany",
			"India",
			"Indonesia",
			"Italy",
			"Japan",
			"Kuwait",
			"Malaysia",
			"Nepal",
			"Netherlands",
			"New Zealand",
			"Norway",
			"Oman",
			"Pakistan",
			"Philippines",
			"Qatar",
			"Saudi Arabia",
			"Singapore",
			"South Korea",
			"Spain",
			"Sri Lanka",
			"Sweden",
			"Switzerland",
			"Syria",
			"Thailand",
			"United Arab Emirates",
			"United Kingdom",
			"United States",
			"Vietnam",
			"Yemen",
		],
	}),
	watch: {
		hideNonEssential(val) {
			if (typeof localStorage !== "undefined") {
				localStorage.setItem("posawesome_hide_non_essential_fields", JSON.stringify(val));
			}
		},
		birthday(newVal) {
			// Check if the user has entered 8 digits without separators (e.g., 04111994)
			if (newVal && /^\d{8}$/.test(newVal)) {
				try {
					const day = newVal.substring(0, 2);
					const month = newVal.substring(2, 4);
					const year = newVal.substring(4);

					// Format it as a hyphenated date for display
					this.birthday = `${day}-${month}-${year}`;

					// Update calendar (implemented below)
					this.updateCalendarDate(day, month, year);
				} catch (error) {
					console.error("Error processing 8-digit date:", error);
				}
			}
			// Check if the date is already in DD-MM-YYYY format
			else if (newVal && /^\d{2}-\d{2}-\d{4}$/.test(newVal)) {
				try {
					const parts = newVal.split("-");
					const day = parts[0];
					const month = parts[1];
					const year = parts[2];

					// Update calendar to show the correct month
					this.updateCalendarDate(day, month, year);
				} catch (error) {
					console.error("Error processing formatted date:", error);
				}
			}
		},

		// Add a watcher for the calendar menu to ensure it shows the right date when opened
		birthday_menu(isOpen) {
			if (isOpen && this.birthday && /^\d{2}-\d{2}-\d{4}$/.test(this.birthday)) {
				try {
					const parts = this.birthday.split("-");
					const day = parts[0];
					const month = parts[1];
					const year = parts[2];

					// Update calendar date when menu opens
					this.$nextTick(() => {
						this.updateCalendarDate(day, month, year);
					});
				} catch (error) {
					console.error("Error updating calendar on menu open:", error);
				}
			}
		},
	},
	computed: {},
	methods: {
		focusCustomerNameField() {
			this.$nextTick(() => {
				const field = this.$refs.customerNameField;
				if (field && typeof field.focus === "function") {
					field.focus();
				}
			});
		},
		handleDialogEscape() {
			if (this.confirmDialog) {
				this.confirmClose();
				return;
			}
			this.confirm_close();
		},
		handleConfirmEscape() {
			this.confirmClose();
		},
		// Add a new method to update calendar date
		updateCalendarDate(day, month, year) {
			// First close the date picker if it's open
			const wasOpen = this.birthday_menu;
			this.birthday_menu = false;

			// Use nextTick to ensure DOM updates
			this.$nextTick(() => {
				// Format date in YYYY-MM-DD format for Vuetify
				const tempDate = `${year}-${month}-${day}`;

				// Try to directly set the calendar's date
				setTimeout(() => {
					if (this.$refs.birthday_menu) {
						this.$refs.birthday_menu.date = tempDate;
						// Optionally reopen menu if it was open
						if (wasOpen) {
							this.birthday_menu = true;
						}
					}
				}, 50);
			});
		},
		confirm_close() {
			// Check if any data has been entered
			if (
				this.customer_name ||
				this.tax_id ||
				this.mobile_no ||
				this.address_line1 ||
				this.email_id ||
				this.referral_code ||
				this.birthday
			) {
				this.confirmDialog = true;
			} else {
				// If no data entered, just close
				this.close_dialog();
			}
		},
		confirmClose() {
			this.confirmDialog = false;
			this.close_dialog();
		},
		close_dialog() {
			this.confirmDialog = false;
			this.customersStore.closeUpdateCustomerDialog();
			this.clear_customer();
		},
		clear_customer() {
			this.customer_name = "";
			this.tax_id = "";
			this.mobile_no = "";
			this.address_line1 = "";
			this.city = "";
			this.country = (this.pos_profile && this.pos_profile.posa_default_country) || "Pakistan";
			this.email_id = "";
			this.referral_code = "";
			this.birthday = "";
			this.customer_id = "";
			this.customer_type = "Individual";
			this.gender = "";
			this.loyalty_points = null;
			this.loyalty_program = null;

			const defaultGroup = frappe.defaults.get_user_default("Customer Group");
			this.group = (defaultGroup && this.groups.includes(defaultGroup)) ? defaultGroup : (this.groups[0] || "");

			const defaultTerritory = frappe.defaults.get_user_default("Territory");
			this.territory = (defaultTerritory && this.territorys.includes(defaultTerritory)) ? defaultTerritory : (this.territorys[0] || "");
		},
		getCustomerGroups() {
			if (this.groups.length > 0) return Promise.resolve();
			const vm = this;
			return frappe.db
				.get_list("Customer Group", {
					fields: ["name"],
					filters: { is_group: 0 },
					limit: 1000,
					order_by: "name",
				})
				.then((data) => {
					if (data.length > 0) {
						vm.groups = data.map((el) => el.name);
						const defaultGroup = frappe.defaults.get_user_default("Customer Group");
						if (defaultGroup && vm.groups.includes(defaultGroup)) {
							vm.group = defaultGroup;
						} else if (!vm.group || !vm.groups.includes(vm.group)) {
							vm.group = vm.groups[0] || "";
						}
					}
				});
		},
		getCustomerTerritorys() {
			if (this.territorys.length > 0) return Promise.resolve();
			const vm = this;
			return frappe.db
				.get_list("Territory", {
					fields: ["name"],
					filters: { is_group: 0 },
					limit: 5000,
					order_by: "name",
				})
				.then((data) => {
					if (data.length > 0) {
						vm.territorys = data.map((el) => el.name);
						const defaultTerritory = frappe.defaults.get_user_default("Territory");
						if (defaultTerritory && vm.territorys.includes(defaultTerritory)) {
							vm.territory = defaultTerritory;
						} else if (!vm.territory || !vm.territorys.includes(vm.territory)) {
							vm.territory = vm.territorys[0] || "";
						}
					}
				});
		},
		getGenders() {
			const vm = this;
			frappe.db
				.get_list("Gender", {
					fields: ["name"],
					page_length: 10,
				})
				.then((data) => {
					if (data.length > 0) {
						data.forEach((el) => {
							vm.genders.push(el.name);
						});
					}
				});
		},
		formatBirthdayOnInput() {
			// Handle 8-digit format (DDMMYYYY)
			if (this.birthday && /^\d{8}$/.test(this.birthday)) {
				try {
					const day = this.birthday.substring(0, 2);
					const month = this.birthday.substring(2, 4);
					const year = this.birthday.substring(4);
					this.birthday = `${day}-${month}-${year}`;
				} catch (error) {
					console.error("Error formatting date:", error);
				}
			}
		},
		async submit_dialog() {
			const vm = this;
			if (!this.customer_name) {
				frappe.throw(__("Customer Name is required"));
				return;
			}

			// Auto-resolve group and territory to valid non-group leaf options if empty or invalid
			if (!this.group || (this.groups.length > 0 && !this.groups.includes(this.group))) {
				const defaultGroup = frappe.defaults.get_user_default("Customer Group");
				this.group = (defaultGroup && this.groups.includes(defaultGroup)) ? defaultGroup : (this.groups[0] || "");
			}

			if (!this.territory || (this.territorys.length > 0 && !this.territorys.includes(this.territory))) {
				const defaultTerritory = frappe.defaults.get_user_default("Territory");
				this.territory = (defaultTerritory && this.territorys.includes(defaultTerritory)) ? defaultTerritory : (this.territorys[0] || "");
			}

			if (!this.group) {
				frappe.throw(__("Customer group is required"));
				return;
			}

			if (!this.territory) {
				frappe.throw(__("Customer territory is required"));
				return;
			}

			// Format birthday to YYYY-MM-DD if it exists and is in another format
			let formatted_birthday = null;
			if (this.birthday) {
				try {
					// First check if it's a date without separators (e.g., 04111994 for 04-11-1994)
					if (/^\d{8}$/.test(this.birthday)) {
						const day = this.birthday.substring(0, 2);
						const month = this.birthday.substring(2, 4);
						const year = this.birthday.substring(4);
						formatted_birthday = `${year}-${month}-${day}`;
					}
					// Check if it's in DD-MM-YYYY format
					else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(this.birthday)) {
						const parts = this.birthday.split("-");
						if (parts.length === 3) {
							const day = parts[0].padStart(2, "0");
							const month = parts[1].padStart(2, "0");
							const year = parts[2];
							formatted_birthday = `${year}-${month}-${day}`;
						}
					}
					// Handle DD/MM/YYYY format
					else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(this.birthday)) {
						const parts = this.birthday.split("/");
						if (parts.length === 3) {
							const day = parts[0].padStart(2, "0");
							const month = parts[1].padStart(2, "0");
							const year = parts[2];
							formatted_birthday = `${year}-${month}-${day}`;
						}
					}
					// For any other format, try to use the browser's date parsing
					else if (this.birthday) {
						try {
							const date = new Date(this.birthday);
							// Check if the date is valid
							if (!isNaN(date.getTime())) {
								const year = date.getFullYear();
								const month = String(date.getMonth() + 1).padStart(2, "0");
								const day = String(date.getDate()).padStart(2, "0");
								formatted_birthday = `${year}-${month}-${day}`;
							}
						} catch (e) {
							console.error("Failed to parse date:", e);
						}
					}
				} catch (error) {
					console.error("Error formatting date:", error);
					formatted_birthday = null;
				}
			}

			// Create args object to use in callback
			const args = {
				customer_id: this.customer_id,
				customer_name: this.customer_name,
				tax_id: this.tax_id,
				mobile_no: this.mobile_no,
				address_line1: this.address_line1,
				city: this.city,
				country: this.country,
				email_id: this.email_id,
				referral_code: this.referral_code,
				birthday: formatted_birthday || this.birthday,
				customer_group: this.group,
				territory: this.territory,
				customer_type: this.customer_type,
				gender: this.gender,
			};
			const apiArgs = {
				...args,
				company: vm.pos_profile.company,
				pos_profile_doc: vm.pos_profile.name,
				pos_opening_shift: vm.uiStore.posOpeningShift?.name,
				method: this.customer_id ? "update" : "create",
			};

			const customersStore = useCustomersStore();

			if (isOffline()) {
				await saveOfflineCustomer({ args: apiArgs });
				vm.toastStore.show({ title: __("Customer saved offline"), color: "warning" });
				args.name = this.customer_name;
				await customersStore.addOrUpdateCustomer({
					name: args.name,
					customer_name: args.customer_name,
					mobile_no: args.mobile_no,
					email_id: args.email_id,
					tax_id: args.tax_id,
					primary_address: args.address_line1,
				});
				vm.close_dialog();
				return;
			}

			frappe.call({
				method: "posawesome.posawesome.api.customers.create_customer",
				args: apiArgs,
				callback: async (r) => {
					if (!r.exc && r.message.name) {
						let text = r.message.already_exists
							? __("Customer already exists and was selected.")
							: __("Customer created successfully.");
						if (vm.customer_id) {
							text = __("Customer updated successfully.");
						}
						vm.toastStore.show({
							title: text,
							color: "success",
						});
						args.name = r.message.name;
						frappe.utils.play_sound("submit");
						await customersStore.addOrUpdateCustomer({
							name: args.name,
							customer_name: args.customer_name,
							mobile_no: args.mobile_no,
							email_id: args.email_id,
							tax_id: args.tax_id,
							primary_address: args.address_line1,
						});
						vm.close_dialog();
					} else {
						frappe.utils.play_sound("error");
						vm.toastStore.show({
							title: __("Customer creation failed."),
							color: "error",
						});
					}
				},
			});
		},
		onDateSelect() {
			// Close the menu
			this.birthday_menu = false;

			// Format date if it's a JavaScript Date object or full date string (from date picker)
			if (this.birthday) {
				try {
					// Handle both JavaScript Date objects and strings with GMT
					let dateObj;
					if (typeof this.birthday === "object") {
						dateObj = this.birthday;
					} else if (
						typeof this.birthday === "string" &&
						(this.birthday.includes("GMT") || this.birthday.includes("T"))
					) {
						dateObj = new Date(this.birthday);
					} else {
						// Already formatted or something else, leave it
						return;
					}

					const year = dateObj.getFullYear();
					const month = String(dateObj.getMonth() + 1).padStart(2, "0");
					const day = String(dateObj.getDate()).padStart(2, "0");

					// Format as DD-MM-YYYY
					this.birthday = `${day}-${month}-${year}`;
				} catch (error) {
					console.error("Error formatting date from picker:", error);
				}
			}
		},
	},
	created: function () {
		if (typeof localStorage !== "undefined") {
			const saved = localStorage.getItem("posawesome_hide_non_essential_fields");
			if (saved !== null) {
				this.hideNonEssential = JSON.parse(saved);
			}
		}
		// Watch store state for dialog opening
		this.$watch(
			() => this.isUpdateCustomerDialogOpen,
			(isOpen) => {
				if (isOpen) {
					this.focusCustomerNameField();
					const data = this.customerToUpdate;
					if (data) {
						this.customer_name = data.customer_name || data.name || ""; // fallback
						this.customer_id = data.name;
						this.address_line1 = data.primary_address || data.address_line1 || "";
						this.city = data.city || "";
						this.country =
							data.country ||
							(this.pos_profile && this.pos_profile.posa_default_country) ||
							"Pakistan";
						this.tax_id = data.tax_id;
						this.mobile_no = data.mobile_no;
						this.email_id = data.email_id;
						this.referral_code = data.referral_code;
						this.birthday = data.birthday;
						this.group = data.customer_group;
						this.territory = data.territory;
						this.loyalty_points = data.loyalty_points;
						this.loyalty_program = data.loyalty_program;
						this.gender = data.gender;
					} else {
						// Setup for new customer
						this.clear_customer();
					}
				}
			},
		);

		// Watch Store for POS Profile
		this.$watch(
			() => this.uiStore.posProfile,
			(profile) => {
				if (profile) {
					this.pos_profile = profile;
					this.country = (profile && profile.posa_default_country) || "Pakistan";
				}
			},
			{ deep: true, immediate: true },
		);

		/*
		this.eventBus.on("register_pos_profile", (data) => {
			this.pos_profile = data.pos_profile;
			this.country = (this.pos_profile && this.pos_profile.posa_default_country) || "Pakistan";
		});
		this.eventBus.on("payments_register_pos_profile", (data) => {
			this.pos_profile = data.pos_profile;
			this.country = (this.pos_profile && this.pos_profile.posa_default_country) || "Pakistan";
		});
		*/
		this.getCustomerGroups();
		this.getCustomerTerritorys();
		this.getGenders();
	},
};
</script>

<style scoped>
.update-customer-dialog-card,
.confirm-dialog-card {
	border-radius: var(--pos-radius-lg, 16px) !important;
	background: var(--pos-surface-raised, #ffffff) !important;
	border: 1px solid var(--pos-border-light, #e2e8f0) !important;
	box-shadow: var(--pos-shadow-lg, 0 10px 30px rgba(0, 0, 0, 0.12)) !important;
	overflow: hidden;
}

.confirm-icon-wrap {
	width: 40px;
	height: 40px;
	border-radius: 12px;
	background: color-mix(in srgb, var(--pos-warning, #f59e0b) 12%, transparent);
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.dialog-header-icon-wrap {
	width: 36px;
	height: 36px;
	border-radius: 10px;
	background: color-mix(in srgb, var(--pos-primary, #2563eb) 10%, transparent);
	display: flex;
	align-items: center;
	justify-content: center;
}

.dialog-title {
	color: var(--pos-text-primary, #0f172a);
}

.dialog-subtitle {
	color: var(--pos-text-secondary, #64748b);
}

.action-btn {
	font-weight: 600 !important;
	text-transform: none !important;
	letter-spacing: normal !important;
}

.gap-2 {
	gap: 8px;
}

.gap-3 {
	gap: 12px;
}

:deep(.v-field) {
	border-radius: var(--pos-radius-md, 10px) !important;
}
</style>
