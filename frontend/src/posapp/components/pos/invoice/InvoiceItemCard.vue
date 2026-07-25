<template>
	<div class="invoice-item-card pos-themed-card" :class="{ 'is-return-item': isReturnInvoice }">
		<!-- Product Identity Region -->
		<div class="invoice-item-card__identity">
			<div class="cart-item-thumb" aria-hidden="true">
				<v-img v-if="itemImage" :src="itemImage" :alt="itemTitle" cover class="cart-item-thumb__image" />
				<v-icon v-else size="20" class="cart-item-thumb__icon">mdi-package-variant-closed</v-icon>
			</div>
			<div class="cart-item-copy">
				<div class="cart-item-title-row">
					<span class="cart-item-title" :title="itemTitle">{{ itemTitle }}</span>
					<div class="cart-item-badges" v-if="hasBadges">
						<v-chip v-if="item.is_bundle" color="secondary" size="x-small" class="cart-item-badge">
							{{ __("Bundle") }}
						</v-chip>
						<v-chip v-if="item.name_overridden" color="primary" size="x-small" class="cart-item-badge">
							{{ __("Edited") }}
						</v-chip>
						<v-chip v-if="item.batch_no_is_expired" color="error" size="x-small" variant="flat" class="cart-item-badge">
							{{ __("Expired") }}
						</v-chip>
						<v-chip v-if="item.has_batch_no && item.batch_no" color="info" size="x-small" variant="tonal" class="cart-item-badge">
							{{ __("Batch") }}: {{ item.batch_no }}
						</v-chip>
						<v-chip v-if="item.posa_is_offer || item.is_free_item" color="success" size="x-small" variant="flat" class="cart-item-badge">
							{{ __("Offer") }}
						</v-chip>
					</div>
				</div>
				<div class="cart-item-meta-row">
					<span class="cart-item-meta" :title="itemMetaTitle">{{ itemMetaTitle }}</span>
					<div class="cart-item-name-actions" v-if="posProfile.posa_allow_line_item_name_override && !item.posa_is_replace">
						<v-btn
							icon
							size="x-small"
							variant="text"
							class="cart-item-name-action"
							@click.stop="$emit('open-name-dialog', item)"
							:aria-label="__('Edit item name')"
						>
							<v-icon size="x-small">mdi-pencil-outline</v-icon>
						</v-btn>
						<v-btn
							v-if="item.name_overridden"
							icon
							size="x-small"
							variant="text"
							class="cart-item-name-action"
							@click.stop="$emit('reset-item-name', item)"
							:aria-label="__('Reset item name')"
						>
							<v-icon size="x-small">mdi-undo</v-icon>
						</v-btn>
					</div>
				</div>
			</div>
		</div>

		<!-- Quantity Counter Region -->
		<div class="invoice-item-card__qty">
			<div class="posa-cart-table__qty-counter" :class="{ 'rtl-layout': isRTL }">
				<v-btn
					:disabled="disableDecrement"
					size="small"
					variant="flat"
					class="posa-cart-table__qty-btn minus-btn qty-control-btn"
					@click.stop="handleMinusClick"
					:aria-label="__('Decrease quantity')"
				>
					<v-icon size="small">mdi-minus</v-icon>
				</v-btn>
				<div
					v-if="!isEditingQty"
					class="posa-cart-table__qty-display amount-value"
					:class="{ 'negative-number': isNegative(item.qty), 'large-number': qtyLength > 6 }"
					:title="formatFloat(item.qty, hideQtyDecimals ? 0 : undefined)"
					@click.stop="openQtyEdit"
					tabindex="0"
					data-pos-keyboard-target="cart-qty"
					role="button"
					:aria-label="__('Edit quantity')"
					@keydown.enter.prevent="openQtyEdit"
					@keydown.space.prevent="openQtyEdit"
				>
					{{ formatFloat(item.qty, hideQtyDecimals ? 0 : undefined) }}
				</div>
				<v-text-field
					v-else
					v-model="editingQtyValue"
					density="compact"
					variant="outlined"
					class="posa-cart-table__qty-input"
					@blur="closeQtyEdit"
					@keydown.enter.prevent="closeQtyEdit"
					@keydown.esc.prevent="cancelQtyEdit"
					@click.stop
					ref="qtyInput"
					:autofocus="true"
					type="number"
					:disabled="disableInput"
				></v-text-field>
				<v-btn
					:disabled="disableIncrement"
					size="small"
					variant="flat"
					class="posa-cart-table__qty-btn plus-btn qty-control-btn"
					@click.stop="$emit('add-one', item)"
					:aria-label="__('Increase quantity')"
				>
					<v-icon size="small">mdi-plus</v-icon>
				</v-btn>
			</div>
		</div>

		<!-- Rate Region -->
		<div class="invoice-item-card__rate">
			<bdi class="cart-item-money cart-item-rate">
				<span class="cart-rate-label">{{ __("Rate") }}</span>
				<span class="currency-symbol">{{ currencySymbol(displayCurrency) }}</span>
				<span class="amount-value" :class="{ 'negative-number': isNegative(item.rate) }">
					{{ formatCurrency(item.rate) }}
				</span>
			</bdi>
		</div>

		<!-- Amount Region -->
		<div class="invoice-item-card__amount">
			<bdi class="cart-item-money cart-item-amount">
				<span class="currency-symbol">{{ currencySymbol(displayCurrency) }}</span>
				<span class="amount-value" :class="{ 'negative-number': isNegative(item.qty * item.rate) }">
					{{ formatCurrency(item.qty * item.rate) }}
				</span>
			</bdi>
		</div>

		<!-- Action Cluster Region -->
		<div class="invoice-item-card__actions">
			<div class="cart-item-actions">
				<v-btn
					icon
					size="small"
					variant="text"
					class="cart-item-action details-action-btn"
					@click.stop="$emit('open-details', item)"
					:aria-label="__('Item details')"
				>
					<v-icon size="small">mdi-dots-vertical</v-icon>
					<v-tooltip activator="parent" location="bottom">{{ __("Details") }}</v-tooltip>
				</v-btn>
				<v-btn
					:disabled="!!item.posa_is_replace"
					size="small"
					variant="text"
					class="cart-item-action delete-action-btn"
					@click.stop="$emit('remove-item', item)"
					:aria-label="__('Remove item')"
				>
					<v-icon size="small">mdi-delete-outline</v-icon>
					<v-tooltip activator="parent" location="bottom">{{ __("Remove") }}</v-tooltip>
				</v-btn>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from "vue";

defineOptions({
	name: "InvoiceItemCard",
});

const props = defineProps({
	item: {
		type: Object,
		required: true,
	},
	posProfile: {
		type: Object,
		default: () => ({}),
	},
	isReturnInvoice: Boolean,
	invoiceType: String,
	displayCurrency: String,
	formatFloat: {
		type: Function,
		required: true,
	},
	formatCurrency: {
		type: Function,
		required: true,
	},
	currencySymbol: {
		type: Function,
		required: true,
	},
	isNumber: Function,
	isNegative: {
		type: Function,
		required: true,
	},
	hideQtyDecimals: Boolean,
	isRTL: Boolean,
});

const emit = defineEmits([
	"open-name-dialog",
	"reset-item-name",
	"add-one",
	"update-qty",
	"minus-click",
	"calc-uom",
	"update-rate",
	"update-discount-percent",
	"update-discount-amount",
	"toggle-offer",
	"open-details",
	"remove-item",
]);

const __ = (window as any).__ || ((text: string) => text);

const isEditingQty = ref(false);
const editingQtyValue = ref("");
const qtyInput = ref<any>(null);

const qtyLength = computed(() => String(Math.abs(props.item?.qty || 0)).replace(".", "").length);

const itemTitle = computed(() => props.item?.item_name || props.item?.item_code || __("Unnamed item"));

const itemImage = computed(
	() =>
		props.item?.image || props.item?.item_image || props.item?.thumbnail || props.item?.item_image_url || "",
);

const itemMetaParts = computed(() => {
	const parts: string[] = [];
	const code = props.item?.item_code;
	if (code && code !== props.item?.item_name) {
		parts.push(code);
	}
	if (props.item?.uom) {
		parts.push(props.item.uom);
	}
	return parts;
});

const itemMetaTitle = computed(() => itemMetaParts.value.join(" · ") || props.item?.uom || "");

const hasBadges = computed(() => {
	return (
		props.item?.is_bundle ||
		props.item?.name_overridden ||
		props.item?.batch_no_is_expired ||
		(props.item?.has_batch_no && props.item?.batch_no) ||
		props.item?.posa_is_offer ||
		props.item?.is_free_item
	);
});

const disableDecrement = computed(
	() =>
		!!props.item?.posa_is_replace ||
		(props.isReturnInvoice &&
			(props.item?.is_free_item || props.item?.posa_is_offer || props.item?.posa_is_replace)),
);

const disableIncrement = computed(
	() =>
		!!props.item?.posa_is_replace ||
		props.item?.disable_increment ||
		(props.isReturnInvoice &&
			(props.item?.is_free_item || props.item?.posa_is_offer || props.item?.posa_is_replace)),
);

const disableInput = computed(
	() =>
		props.isReturnInvoice &&
		(props.item?.is_free_item || props.item?.posa_is_offer || props.item?.posa_is_replace),
);

function openQtyEdit() {
	if (disableInput.value) return;
	isEditingQty.value = true;
	editingQtyValue.value = "";
	nextTick(() => {
		qtyInput.value?.focus?.();
	});
}

function closeQtyEdit() {
	if (isEditingQty.value) {
		if (editingQtyValue.value !== "" && editingQtyValue.value != null) {
			const newQty = parseFloat(editingQtyValue.value);
			const val = !newQty || newQty <= 0 ? 1 : newQty;
			emit("update-qty", props.item, val);
		}
		isEditingQty.value = false;
		editingQtyValue.value = "";
	}
}

function cancelQtyEdit() {
	isEditingQty.value = false;
	editingQtyValue.value = "";
}

function handleMinusClick() {
	emit("minus-click", props.item);
}
</script>

<style scoped>
.invoice-item-card {
	display: grid;
	grid-template-columns: minmax(180px, 1fr) 120px 100px 112px 88px;
	align-items: center;
	gap: 8px;
	min-height: 68px;
	padding: 8px 12px;
	border-bottom: 1px solid var(--pos-border-light, #e2e8f0);
	background: var(--pos-surface-raised, #ffffff);
	transition: background-color 0.2s ease;
	border-radius: 8px;
	margin-bottom: 4px;
}

.invoice-item-card:hover {
	background: color-mix(in srgb, var(--pos-primary-container, #eff6ff) 14%, var(--pos-surface-raised, #ffffff));
}

.invoice-item-card__identity {
	display: grid;
	grid-template-columns: 40px minmax(0, 1fr);
	align-items: center;
	gap: 10px;
	min-width: 0;
}

.cart-item-thumb {
	width: 40px;
	height: 40px;
	border-radius: 8px;
	border: 1px solid var(--pos-border-light, #e2e8f0);
	background: color-mix(in srgb, var(--pos-primary-container, #eff6ff) 20%, var(--pos-surface-muted, #f8fafc));
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	flex-shrink: 0;
}

.cart-item-thumb__image {
	width: 100%;
	height: 100%;
}

.cart-item-copy {
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
}

.cart-item-title-row,
.cart-item-meta-row {
	display: flex;
	align-items: center;
	gap: 6px;
	min-width: 0;
}

.cart-item-title {
	font-size: 13px;
	font-weight: 760;
	line-height: 1.25;
	color: var(--pos-text-primary, #1e293b);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.cart-item-meta {
	font-size: 11px;
	font-weight: 560;
	color: var(--pos-text-secondary, #64748b);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.cart-item-badges {
	display: flex;
	align-items: center;
	gap: 4px;
	flex-shrink: 0;
}

.cart-item-badge {
	height: 18px !important;
	font-size: 10px !important;
}

.invoice-item-card__qty {
	display: flex;
	align-items: center;
	justify-content: center;
}

.invoice-item-card__rate {
	display: flex;
	align-items: center;
	justify-content: flex-end;
}

.invoice-item-card__amount {
	display: flex;
	align-items: center;
	justify-content: flex-end;
}

.invoice-item-card__actions {
	display: flex;
	align-items: center;
	justify-content: flex-end;
}

.cart-item-actions {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 2px;
}

.cart-item-action {
	width: 36px !important;
	height: 36px !important;
	min-width: 36px !important;
	border-radius: 8px !important;
}

.details-action-btn:hover {
	color: var(--pos-primary, #3b82f6) !important;
}

.delete-action-btn:hover {
	color: var(--pos-error, #ef4444) !important;
	background: color-mix(in srgb, var(--pos-error, #ef4444) 10%, transparent) !important;
}

@media (max-width: 1199px) {
	.invoice-item-card {
		display: grid;
		grid-template-columns: 40px minmax(0, 1fr) auto;
		grid-template-areas:
			"image identity amount"
			"image meta amount"
			"qty qty actions";
		min-height: 104px;
		gap: 6px 10px;
		padding: 10px;
	}

	.invoice-item-card__identity {
		grid-area: identity;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.cart-item-thumb {
		grid-area: image;
	}

	.invoice-item-card__amount {
		grid-area: amount;
		align-self: flex-start;
	}

	.invoice-item-card__qty {
		grid-area: qty;
		justify-content: flex-start;
		align-self: center;
	}

	.invoice-item-card__rate {
		display: none;
	}

	.invoice-item-card__actions {
		grid-area: actions;
		justify-content: flex-end;
		align-self: center;
	}

	.cart-rate-label {
		display: inline-flex;
	}
}
</style>
