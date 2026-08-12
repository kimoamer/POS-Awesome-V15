<template>
	<v-row justify="center">
		<v-dialog v-model="addressDialog" max-width="600px">
			<v-card>
				<v-card-title>
					<span class="text-h5 text-primary">{{ __("Add New Address") }}</span>
				</v-card-title>
				<v-card-text class="pa-0">
					<v-container>
						<v-row>
							<v-col cols="12">
								<v-text-field
									density="compact"
									color="primary"
									:label="frappe._('Address Name')"
									class="pos-themed-input"
									hide-details
									v-model="address.name"
								></v-text-field>
							</v-col>
							<v-col cols="12">
								<v-text-field
									density="compact"
									color="primary"
									:label="frappe._('Address Line 1')"
									class="pos-themed-input"
									hide-details
									v-model="address.address_line1"
								></v-text-field>
							</v-col>
							<v-col cols="12">
								<v-text-field
									density="compact"
									color="primary"
									:label="frappe._('Address Line 2')"
									class="pos-themed-input"
									hide-details
									v-model="address.address_line2"
								></v-text-field>
							</v-col>
							<v-col cols="6">
								<v-text-field
									:label="__('City')"
									density="compact"
									color="primary"
									class="pos-themed-input"
									hide-details
									v-model="address.city"
								></v-text-field>
							</v-col>
							<v-col cols="6">
								<v-text-field
									:label="__('State')"
									density="compact"
									class="pos-themed-input"
									hide-details
									v-model="address.state"
								></v-text-field>
							</v-col>
						</v-row>
					</v-container>
				</v-card-text>
				<v-card-actions>
					<v-spacer></v-spacer>
					<v-btn color="error" theme="dark" @click="close_dialog">{{ __("Close") }}</v-btn>
					<v-btn color="success" theme="dark" @click="submit_dialog">{{ __("Submit") }}</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</v-row>
</template>

<script>
import { useToastStore } from "../../../stores/toastStore";
import { useUIStore } from "../../../stores/uiStore";

export default {
	setup() {
		const toastStore = useToastStore();
		const uiStore = useUIStore();
		return { toastStore, uiStore };
	},
	data: () => ({
		address: {},
		customer: "",
	}),
	computed: {
		addressDialog: {
			get() {
				return this.uiStore.newAddressDialog;
			},
			set(value) {
				if (!value) this.uiStore.closeNewAddress();
			},
		},
	},

	methods: {
		close_dialog() {
			this.uiStore.closeNewAddress();
		},

		submit_dialog() {
			var vm = this;
			this.address.customer = this.customer;
			this.address.doctype = "Customer";
			this.address.company = this.uiStore.posProfile?.company;
			this.address.pos_profile_doc = this.uiStore.posProfile?.name;
			this.address.pos_opening_shift = this.uiStore.posOpeningShift?.name;
			frappe.call({
				method: "posawesome.posawesome.api.customers.make_address",
				args: {
					args: this.address,
				},
				callback: (r) => {
					if (!r.exc) {
						vm.eventBus.emit("add_the_new_address", r.message);
						vm.toastStore.show({
							text: __("Customer Address created successfully."),
							color: "success",
						});
						vm.uiStore.closeNewAddress();
						vm.customer = "";
						vm.address = {};
					}
				},
			});
		},
	},
	created() {
		this.customer = this.uiStore.newAddressCustomer || "";
	},
	watch: {
		"uiStore.newAddressCustomer"(customer) {
			this.customer = customer || "";
			this.address = {};
		},
	},
};
</script>

<style scoped></style>
