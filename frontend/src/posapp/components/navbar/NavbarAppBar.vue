<template>
	<v-app-bar
		flat
		:height="appBarHeight"
		:class="[
			'pos-unified-header pos-theme-immediate',
			rtlClasses,
			isRtl ? 'pos-unified-header--rtl' : 'pos-unified-header--ltr',
			{
				'pos-unified-header--mobile': isMobile,
				'pos-unified-header--tablet': isTablet,
				'pos-unified-header--compact': isCompactDesktop,
			},
		]"
		:style="[rtlStyles]"
	>
		<div class="pos-unified-header__shell">
			<div class="pos-unified-header__row pos-unified-header__row--main">
				<v-btn
					v-if="showDrawerTrigger"
					icon
					variant="text"
					class="pos-header-control pos-header-drawer-trigger"
					:aria-label="__('Open navigation')"
					@click="$emit('nav-click')"
				>
					<v-icon size="19">mdi-menu-open</v-icon>
					<v-tooltip activator="parent" location="bottom">
						{{ __("Navigation") }}
					</v-tooltip>
				</v-btn>

				<v-tooltip location="bottom" :disabled="!companyLabel">
					<template #activator="{ props: tooltipProps }">
						<button
							v-bind="tooltipProps"
							type="button"
							class="pos-header-brand"
							:aria-label="brandAriaLabel"
							@click="$emit('go-desk')"
							@keydown.enter="$emit('go-desk')"
						>
							<span class="pos-header-brand__mark">
								<v-img
									:src="brandLogo"
									alt="POSMate"
									width="28"
									height="28"
									cover
									class="pos-header-brand__logo"
									loading="lazy"
								/>
							</span>
							<span class="pos-header-brand__copy">
								<span class="pos-header-brand__title">{{ __("POSMate") }}</span>
								<span v-if="showCompanyLabel" class="pos-header-brand__company">
									{{ companyLabel }}
								</span>
							</span>
						</button>
					</template>
					{{ companyLabel }}
				</v-tooltip>

				<div v-if="showInlineNavigation" ref="navViewport" class="pos-header-nav-zone">
					<nav class="pos-header-nav-capsule" :aria-label="__('Primary navigation')">
						<v-btn
							v-for="item in visibleNavigationItems"
							:key="navigationKey(item)"
							:to="item.to"
							variant="text"
							class="pos-header-nav-item"
							:class="{ 'pos-header-nav-item--active': isNavigationItemActive(item) }"
							:aria-current="isNavigationItemActive(item) ? 'page' : undefined"
							:title="item.text"
						>
							<v-icon class="pos-header-nav-item__icon" :size="navIconSize">
								{{ item.icon }}
							</v-icon>
							<span class="pos-header-nav-item__label">{{ item.text }}</span>
							<v-tooltip activator="parent" location="bottom">
								{{ item.text }}
							</v-tooltip>
						</v-btn>

						<v-menu v-if="overflowNavigationItems.length" location="bottom end" :offset="[0, 8]">
							<template #activator="{ props: menuProps }">
								<v-btn
									v-bind="menuProps"
									variant="text"
									class="pos-header-nav-item pos-header-nav-item--more"
									:aria-label="__('More navigation')"
								>
									<v-icon class="pos-header-nav-item__icon" :size="navIconSize">
										mdi-dots-horizontal
									</v-icon>
									<span class="pos-header-nav-item__label">{{ __("More") }}</span>
								</v-btn>
							</template>
							<v-card class="pos-header-overflow-card pos-themed-card" elevation="10">
								<v-list density="compact" nav class="pos-header-overflow-list">
									<v-list-item
										v-for="item in overflowNavigationItems"
										:key="navigationKey(item)"
										:to="item.to"
										:active="isNavigationItemActive(item)"
										class="pos-header-overflow-item"
									>
										<template #prepend>
											<v-icon size="20">{{ item.icon }}</v-icon>
										</template>
										<v-list-item-title>{{ item.text }}</v-list-item-title>
									</v-list-item>
								</v-list>
							</v-card>
						</v-menu>
					</nav>
				</div>

				<div class="pos-header-actions" :class="{ 'pos-header-actions--compact': hideActionLabels }">
					<div class="pos-header-action-shell pos-header-action-shell--status">
						<slot name="status-indicator"></slot>
					</div>

					<NavbarInfoGadgets v-if="!isMobile" class="pos-header-action-shell pos-header-action-shell--info">
						<template #cache-usage-meter>
							<slot name="cache-usage-meter"></slot>
						</template>
						<template #db-usage-gadget>
							<slot name="db-usage-gadget"></slot>
						</template>
						<template #cpu-gadget>
							<slot name="cpu-gadget"></slot>
						</template>
					</NavbarInfoGadgets>

					<v-btn
						icon
						variant="text"
						class="pos-header-control pos-header-offline-btn"
						:class="{ 'pos-header-offline-btn--pending': pendingInvoices > 0 }"
						:aria-label="__('Offline Invoices') + ` (${pendingInvoices})`"
						@click="$emit('show-offline-invoices')"
						@keydown.enter="$emit('show-offline-invoices')"
					>
						<v-badge
							v-if="pendingInvoices > 0"
							:content="pendingInvoices"
							color="error"
							floating
						>
							<v-icon :size="actionIconSize">mdi-file-sync-outline</v-icon>
						</v-badge>
						<v-icon v-else :size="actionIconSize">mdi-file-sync-outline</v-icon>
						<v-tooltip activator="parent" location="bottom">
							{{ __("Offline Invoices") }} ({{ pendingInvoices }})
						</v-tooltip>
					</v-btn>

					<v-btn
						variant="text"
						class="pos-header-control pos-header-cashier-btn"
						:class="{ 'pos-header-cashier-btn--icon-only': hideCashierLabel }"
						:icon="hideCashierLabel"
						:aria-label="cashierButtonLabel"
						@click="$emit('open-employee-switch')"
						@keydown.enter="$emit('open-employee-switch')"
					>
						<v-icon :size="actionIconSize">mdi-account-switch-outline</v-icon>
						<span v-if="!hideCashierLabel" class="pos-header-cashier-btn__label">
							{{ __("Switch Cashier") }}
						</span>
						<v-tooltip activator="parent" location="bottom">
							{{ cashierTooltip }}
						</v-tooltip>
					</v-btn>

					<div class="pos-header-action-shell pos-header-action-shell--notifications">
						<v-btn
							v-if="!isMobile"
							icon
							variant="text"
							class="pos-header-control pos-header-settings-btn"
							:aria-label="__('Settings')"
							@click="$emit('open-settings')"
							@keydown.enter="$emit('open-settings')"
						>
							<v-icon :size="actionIconSize">mdi-cog-outline</v-icon>
							<v-tooltip activator="parent" location="bottom">
								{{ __("Settings") }}
							</v-tooltip>
						</v-btn>
						<slot name="notification-bell"></slot>
					</div>

					<div class="pos-header-action-shell pos-header-action-shell--menu">
						<slot name="menu"></slot>
					</div>
				</div>
			</div>

			<div v-if="isTablet" class="pos-unified-header__row pos-unified-header__row--nav">
				<div ref="tabletNavViewport" class="pos-header-nav-zone pos-header-nav-zone--tablet">
					<nav class="pos-header-nav-capsule pos-header-nav-capsule--tablet" :aria-label="__('Primary navigation')">
						<v-btn
							v-for="item in visibleNavigationItems"
							:key="`tablet-${navigationKey(item)}`"
							:to="item.to"
							variant="text"
							class="pos-header-nav-item"
							:class="{ 'pos-header-nav-item--active': isNavigationItemActive(item) }"
							:aria-current="isNavigationItemActive(item) ? 'page' : undefined"
							:title="item.text"
						>
							<v-icon class="pos-header-nav-item__icon" :size="navIconSize">
								{{ item.icon }}
							</v-icon>
							<span class="pos-header-nav-item__label">{{ item.text }}</span>
						</v-btn>
						<v-menu v-if="overflowNavigationItems.length" location="bottom end" :offset="[0, 8]">
							<template #activator="{ props: menuProps }">
								<v-btn
									v-bind="menuProps"
									variant="text"
									class="pos-header-nav-item pos-header-nav-item--more"
									:aria-label="__('More navigation')"
								>
									<v-icon class="pos-header-nav-item__icon" :size="navIconSize">
										mdi-dots-horizontal
									</v-icon>
									<span class="pos-header-nav-item__label">{{ __("More") }}</span>
								</v-btn>
							</template>
							<v-card class="pos-header-overflow-card pos-themed-card" elevation="10">
								<v-list density="compact" nav class="pos-header-overflow-list">
									<v-list-item
										v-for="item in overflowNavigationItems"
										:key="`tablet-overflow-${navigationKey(item)}`"
										:to="item.to"
										:active="isNavigationItemActive(item)"
										class="pos-header-overflow-item"
									>
										<template #prepend>
											<v-icon size="20">{{ item.icon }}</v-icon>
										</template>
										<v-list-item-title>{{ item.text }}</v-list-item-title>
									</v-list-item>
								</v-list>
							</v-card>
						</v-menu>
					</nav>
				</div>
			</div>

			<div v-if="!isMobile" ref="navMeasure" class="pos-header-nav-measure" aria-hidden="true">
				<span
					v-for="item in navigationItems"
					:key="`measure-${navigationKey(item)}`"
					class="pos-header-nav-item pos-header-nav-item--measure"
					:data-nav-key="navigationKey(item)"
					data-nav-measure-item
				>
					<v-icon class="pos-header-nav-item__icon" :size="navIconSize">
						{{ item.icon }}
					</v-icon>
					<span class="pos-header-nav-item__label">{{ item.text }}</span>
				</span>
				<span class="pos-header-nav-item pos-header-nav-item--measure" data-nav-measure-more>
					<v-icon class="pos-header-nav-item__icon" :size="navIconSize">
						mdi-dots-horizontal
					</v-icon>
					<span class="pos-header-nav-item__label">{{ __("More") }}</span>
				</span>
			</div>
		</div>

		<transition name="loading-fade">
			<div v-if="loadingActive" class="loading-container">
				<div class="glass-card">
					<span class="loading-message">{{ loadingMessage }}</span>
					<div v-if="!loadingIndeterminate" class="progress-badge">{{ loadingProgress }}%</div>
				</div>
				<v-progress-linear
					:model-value="loadingProgress"
					:indeterminate="loadingIndeterminate"
					color="primary"
					height="4"
					absolute
					location="bottom"
					class="glass-progress"
				/>
			</div>
		</transition>
	</v-app-bar>
</template>

<script>
import { useRtl } from "../../composables/core/useRtl";
import posLogo from "../pos/pos.png";
import NavbarInfoGadgets from "./NavbarInfoGadgets.vue";

const NAV_PRIORITY = ["/pos", "/dashboard", "/payments", "/orders", "/barcode", "/gift-cards", "/cash-movement"];

export default {
	name: "NavbarAppBar",
	components: {
		NavbarInfoGadgets,
	},
	setup() {
		const { isRtl, rtlStyles, rtlClasses } = useRtl();
		return {
			isRtl,
			rtlStyles,
			rtlClasses,
			posLogo,
		};
	},
	props: {
		posProfile: {
			type: Object,
			default: () => ({}),
		},
		company: {
			type: String,
			default: "",
		},
		companyImg: {
			type: String,
			default: "",
		},
		navigationItems: {
			type: Array,
			default: () => [],
		},
		pendingInvoices: {
			type: Number,
			default: 0,
		},
		loadingProgress: {
			type: Number,
			default: 0,
		},
		loadingActive: {
			type: Boolean,
			default: false,
		},
		loadingIndeterminate: {
			type: Boolean,
			default: false,
		},
		loadingMessage: {
			type: String,
			default: "Loading app data...",
		},
		cashierName: {
			type: String,
			default: "",
		},
	},
	emits: ["nav-click", "go-desk", "show-offline-invoices", "open-employee-switch", "open-settings"],
	data() {
		return {
			windowWidth: typeof window !== "undefined" ? window.innerWidth : 1280,
			resizeRafId: null,
			navMeasureRafId: null,
			navResizeObserver: null,
			visibleNavigationKeys: null,
		};
	},
	computed: {
		brandLogo() {
			return this.posLogo;
		},
		companyLabel() {
			return this.company || this.posProfile?.company || "";
		},
		showCompanyLabel() {
			return !this.isMobile && this.windowWidth >= 1120 && Boolean(this.companyLabel);
		},
		brandAriaLabel() {
			return this.companyLabel ? `${this.__("POSMate")} - ${this.companyLabel}` : this.__("POSMate");
		},
		displayName() {
			if (this.posProfile && this.posProfile.name) {
				return this.posProfile.name;
			}
			if (frappe.session && frappe.session.user_fullname) {
				return frappe.session.user_fullname;
			}
			if (frappe.session && frappe.session.user) {
				return frappe.session.user;
			}
			return "User";
		},
		cashierChipLabel() {
			return this.cashierName || this.displayName;
		},
		cashierButtonLabel() {
			return this.__("Switch Cashier");
		},
		cashierTooltip() {
			return this.cashierChipLabel
				? `${this.__("Switch Cashier")}: ${this.cashierChipLabel}`
				: this.__("Switch Cashier");
		},
		isMobile() {
			return this.windowWidth < 768;
		},
		isTablet() {
			return this.windowWidth >= 768 && this.windowWidth < 1024;
		},
		isCompactDesktop() {
			return this.windowWidth >= 1024 && this.windowWidth < 1280;
		},
		showDrawerTrigger() {
			return this.isMobile;
		},
		showInlineNavigation() {
			return !this.isMobile && !this.isTablet;
		},
		appBarHeight() {
			if (this.isMobile) {
				return 58;
			}
			if (this.isTablet) {
				return 104;
			}
			return this.isCompactDesktop ? 62 : 68;
		},
		hideCashierLabel() {
			return this.windowWidth < 1380;
		},
		hideActionLabels() {
			return this.windowWidth < 1280;
		},
		actionIconSize() {
			return this.windowWidth < 1280 ? 17 : 18;
		},
		navIconSize() {
			return this.windowWidth < 1280 ? 17 : 18;
		},
		visibleNavigationItems() {
			if (this.isMobile) {
				return [];
			}
			if (!Array.isArray(this.visibleNavigationKeys)) {
				return this.navigationItems;
			}
			const visible = new Set(this.visibleNavigationKeys);
			return this.navigationItems.filter((item, index) => visible.has(this.navigationKey(item, index)));
		},
		overflowNavigationItems() {
			if (this.isMobile || !Array.isArray(this.visibleNavigationKeys)) {
				return [];
			}
			const visible = new Set(this.visibleNavigationKeys);
			return this.navigationItems.filter((item, index) => !visible.has(this.navigationKey(item, index)));
		},
	},
	watch: {
		navigationItems: {
			deep: true,
			handler() {
				this.scheduleNavigationMeasure();
			},
		},
		windowWidth() {
			this.scheduleNavigationMeasure();
		},
		isTablet() {
			this.setupNavigationObserver();
			this.scheduleNavigationMeasure();
		},
	},
	mounted() {
		this.updateWindowWidth();
		window.addEventListener("resize", this.updateWindowWidth, { passive: true });
		this.$el.addEventListener("keydown", this.handleKeyboardNavigation, { passive: false });
		this.setupNavigationObserver();
		this.scheduleNavigationMeasure();
	},
	beforeUnmount() {
		window.removeEventListener("resize", this.updateWindowWidth);
		if (this.$el && this.$el.removeEventListener) {
			this.$el.removeEventListener("keydown", this.handleKeyboardNavigation);
		}
		if (this.resizeRafId) {
			cancelAnimationFrame(this.resizeRafId);
			this.resizeRafId = null;
		}
		if (this.navMeasureRafId) {
			cancelAnimationFrame(this.navMeasureRafId);
			this.navMeasureRafId = null;
		}
		if (this.navResizeObserver) {
			this.navResizeObserver.disconnect();
			this.navResizeObserver = null;
		}
	},
	methods: {
		__(text, args = []) {
			if (window.__) {
				const nextArgs = Array.isArray(args) ? args : [args];
				return window.__(text, ...nextArgs);
			}
			return text;
		},
		navigationKey(item, fallbackIndex = 0) {
			return item?.to || item?.text || `nav-${fallbackIndex}`;
		},
		navigationPriority(item, fallbackIndex = 0) {
			const priority = NAV_PRIORITY.indexOf(item?.to);
			return priority === -1 ? 100 + fallbackIndex : priority;
		},
		isNavigationItemActive(item) {
			const routePath = this.$route?.path || "/";
			if (routePath === "/" && item?.to === "/pos") {
				return true;
			}
			return routePath === item?.to;
		},
		updateWindowWidth() {
			if (this.resizeRafId) {
				cancelAnimationFrame(this.resizeRafId);
			}
			this.resizeRafId = requestAnimationFrame(() => {
				this.windowWidth = window.innerWidth;
			});
		},
		setupNavigationObserver() {
			if (this.navResizeObserver) {
				this.navResizeObserver.disconnect();
				this.navResizeObserver = null;
			}
			if (typeof ResizeObserver === "undefined") {
				return;
			}
			this.$nextTick(() => {
				const viewport = this.isTablet ? this.$refs.tabletNavViewport : this.$refs.navViewport;
				if (!viewport) {
					return;
				}
				this.navResizeObserver = new ResizeObserver(() => this.scheduleNavigationMeasure());
				this.navResizeObserver.observe(viewport);
			});
		},
		scheduleNavigationMeasure() {
			if (this.navMeasureRafId) {
				cancelAnimationFrame(this.navMeasureRafId);
			}
			this.navMeasureRafId = requestAnimationFrame(() => {
				this.measureNavigationOverflow();
			});
		},
		measureNavigationOverflow() {
			if (this.isMobile || !this.navigationItems.length) {
				this.visibleNavigationKeys = [];
				return;
			}
			const viewport = this.isTablet ? this.$refs.tabletNavViewport : this.$refs.navViewport;
			const measure = this.$refs.navMeasure;
			if (!viewport || !measure) {
				this.visibleNavigationKeys = this.navigationItems.map((item, index) =>
					this.navigationKey(item, index),
				);
				return;
			}
			const availableWidth = viewport.clientWidth - 4;
			const itemWidths = new Map();
			measure.querySelectorAll("[data-nav-measure-item]").forEach((node) => {
				itemWidths.set(node.dataset.navKey, Math.ceil(node.getBoundingClientRect().width));
			});
			const moreNode = measure.querySelector("[data-nav-measure-more]");
			const moreWidth = Math.ceil(moreNode?.getBoundingClientRect().width || 78);
			const gap = this.windowWidth < 1280 ? 4 : 6;
			const allKeys = this.navigationItems.map((item, index) => this.navigationKey(item, index));
			const totalWidth = allKeys.reduce((sum, key, index) => {
				return sum + (itemWidths.get(key) || 92) + (index ? gap : 0);
			}, 0);

			if (totalWidth <= availableWidth) {
				this.visibleNavigationKeys = allKeys;
				return;
			}

			const candidates = this.navigationItems
				.map((item, index) => ({
					item,
					index,
					key: this.navigationKey(item, index),
					width: itemWidths.get(this.navigationKey(item, index)) || 92,
					priority: this.navigationPriority(item, index),
				}))
				.sort((a, b) => a.priority - b.priority || a.index - b.index);

			const visible = new Set();
			let usedWidth = moreWidth;
			for (const candidate of candidates) {
				const nextWidth = usedWidth + candidate.width + (visible.size ? gap : 0);
				if (nextWidth <= availableWidth || visible.size === 0) {
					visible.add(candidate.key);
					usedWidth = nextWidth;
				}
			}

			this.visibleNavigationKeys = allKeys.filter((key) => visible.has(key));
		},
		handleKeyboardNavigation(event) {
			if (event.key !== "Tab") {
				return;
			}
			this.$nextTick(() => {
				const activeElement = document.activeElement;
				if (activeElement && this.$el.contains(activeElement)) {
					activeElement.scrollIntoView({
						block: "nearest",
						inline: "nearest",
					});
				}
			});
		},
	},
};
</script>

<style scoped>
.pos-unified-header {
	background: color-mix(in srgb, var(--pos-navbar-bg) 94%, transparent) !important;
	border-bottom: 1px solid var(--pos-border-light) !important;
	box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06) !important;
	color: var(--pos-text-primary) !important;
	overflow: visible !important;
	backdrop-filter: blur(16px);
}

.pos-unified-header :deep(.v-toolbar__content) {
	width: 100%;
	height: 100% !important;
	padding: 0 !important;
	overflow: visible;
}

.pos-unified-header :deep(a) {
	text-decoration: none !important;
}

.pos-unified-header__shell {
	width: 100%;
	min-width: 0;
	height: 100%;
	display: grid;
	grid-template-rows: 1fr;
	gap: 6px;
	padding: var(--pos-header-padding-y) var(--pos-header-padding-x);
	box-sizing: border-box;
}

.pos-unified-header__row {
	min-width: 0;
	display: flex;
	align-items: center;
	gap: var(--pos-header-gap);
}

.pos-unified-header--rtl {
	direction: rtl;
}

.pos-unified-header--ltr {
	direction: ltr;
}

.pos-header-brand {
	border: 0;
	background: transparent;
	min-width: 138px;
	max-width: 220px;
	height: 46px;
	padding: 0 10px 0 0;
	display: flex;
	align-items: center;
	gap: 9px;
	border-inline-end: 1px solid var(--pos-border-light);
	color: inherit;
	text-align: start;
	cursor: pointer;
	flex: 0 1 220px;
}

.pos-unified-header--rtl .pos-header-brand {
	padding: 0 0 0 10px;
}

.pos-header-brand__mark {
	width: 36px;
	height: 36px;
	border-radius: 10px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	background:
		linear-gradient(135deg, color-mix(in srgb, var(--pos-primary) 18%, transparent), transparent),
		var(--pos-surface-raised);
	border: 1px solid color-mix(in srgb, var(--pos-primary) 18%, var(--pos-border-light));
	box-shadow: 0 7px 16px rgba(15, 23, 42, 0.07);
	flex: 0 0 36px;
	overflow: hidden;
}

.pos-header-brand__logo {
	border-radius: 9px;
}

.pos-header-brand__copy {
	min-width: 0;
	display: grid;
	gap: 2px;
}

.pos-header-brand__title {
	font-size: var(--pos-header-brand-title-size);
	font-weight: 800;
	line-height: 1.05;
	letter-spacing: 0;
	color: var(--pos-text-primary);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.pos-header-brand__company {
	font-size: var(--pos-header-company-size);
	font-weight: 500;
	line-height: 1.15;
	letter-spacing: 0;
	color: var(--pos-text-muted);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.pos-header-nav-zone {
	position: relative;
	min-width: 0;
	flex: 1 1 auto;
	container-type: inline-size;
}

.pos-header-nav-capsule {
	min-width: 0;
	height: var(--pos-header-nav-height);
	display: flex;
	align-items: center;
	gap: 4px;
	padding: 3px;
	border: 1px solid var(--pos-border-light);
	border-radius: 16px;
	background: color-mix(in srgb, var(--pos-surface-raised) 92%, transparent);
	box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
	overflow: hidden;
}

.pos-header-nav-item {
	height: 34px !important;
	min-height: 34px !important;
	min-width: 36px !important;
	max-width: none;
	padding: 0 9px !important;
	border-radius: 11px !important;
	text-transform: none !important;
	font-size: var(--pos-header-nav-font-size) !important;
	font-weight: 750 !important;
	letter-spacing: 0 !important;
	color: var(--pos-text-muted) !important;
	flex: 0 0 auto;
	text-decoration: none !important;
}

.pos-header-nav-item:deep(a),
.pos-header-nav-item :deep(a) {
	text-decoration: none !important;
}

.pos-header-nav-item :deep(.v-btn__content) {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	min-width: 0;
	max-width: 100%;
	text-decoration: none !important;
}

.pos-header-nav-item :deep(.v-btn__content *),
.pos-header-overflow-item :deep(.v-list-item-title) {
	text-decoration: none !important;
}

.pos-header-nav-item__label {
	min-width: 0;
	overflow: visible;
	text-overflow: clip;
	white-space: nowrap;
}

.pos-header-nav-item__icon {
	color: currentColor;
	flex: 0 0 auto;
}

.pos-header-nav-item:hover,
.pos-header-nav-item--active {
	background: color-mix(in srgb, var(--pos-primary) 11%, var(--pos-surface)) !important;
	color: var(--pos-primary) !important;
}

.pos-header-nav-item--active {
	box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--pos-primary) 16%, transparent);
}

.pos-header-nav-item--more {
	color: var(--pos-primary) !important;
}

.pos-header-overflow-card {
	min-width: 230px;
	padding: 6px;
}

.pos-header-overflow-list {
	background: transparent;
}

.pos-header-overflow-item {
	border-radius: 10px !important;
	min-height: 38px;
}

.pos-header-nav-measure {
	position: absolute;
	inset-block-start: -1000px;
	inset-inline-start: 0;
	display: flex;
	gap: 6px;
	visibility: hidden;
	pointer-events: none;
	height: 0;
	overflow: hidden;
	white-space: nowrap;
}

.pos-header-nav-item--measure {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	box-sizing: border-box;
}

.pos-header-actions {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 6px;
	min-width: 0;
	flex: 0 0 auto;
}

.pos-header-action-shell {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	min-width: 0;
}

.pos-header-control {
	width: var(--pos-header-control-size) !important;
	height: var(--pos-header-control-size) !important;
	min-width: var(--pos-header-control-size) !important;
	min-height: var(--pos-header-control-size) !important;
	border: 1px solid var(--pos-border-light) !important;
	border-radius: 11px !important;
	background: var(--pos-surface-raised) !important;
	color: var(--pos-text-primary) !important;
	box-shadow: 0 6px 14px rgba(15, 23, 42, 0.055) !important;
}

.pos-header-control:hover {
	border-color: color-mix(in srgb, var(--pos-primary) 28%, var(--pos-border-light)) !important;
	color: var(--pos-primary) !important;
}

.pos-header-offline-btn--pending {
	color: var(--pos-warning) !important;
}

.pos-header-cashier-btn {
	width: auto !important;
	min-width: 132px !important;
	padding: 0 11px !important;
	gap: 6px;
	text-transform: none !important;
	font-size: var(--pos-header-action-font-size) !important;
	font-weight: 750 !important;
	letter-spacing: 0 !important;
}

.pos-header-cashier-btn :deep(.v-btn__content) {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	min-width: 0;
}

.pos-header-cashier-btn__label {
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.pos-header-cashier-btn--icon-only {
	min-width: var(--pos-header-control-size) !important;
	width: var(--pos-header-control-size) !important;
	padding: 0 !important;
}

.pos-unified-header--compact .pos-header-brand {
	max-width: 178px;
	flex-basis: 178px;
}

.pos-unified-header--compact .pos-header-nav-capsule {
	height: var(--pos-header-nav-height-compact);
	gap: 3px;
	padding: 3px;
}

.pos-unified-header--compact .pos-header-nav-item {
	height: 32px !important;
	min-height: 32px !important;
	padding: 0 8px !important;
	font-size: var(--pos-header-nav-font-size-compact) !important;
	max-width: none;
}

.pos-unified-header--compact .pos-header-control {
	width: var(--pos-header-control-size-compact) !important;
	height: var(--pos-header-control-size-compact) !important;
	min-width: var(--pos-header-control-size-compact) !important;
	min-height: var(--pos-header-control-size-compact) !important;
}

.pos-unified-header--tablet .pos-unified-header__shell {
	grid-template-rows: minmax(44px, auto) minmax(42px, auto);
	padding-block: 8px;
}

.pos-unified-header--tablet .pos-header-brand {
	max-width: 220px;
	flex: 1 1 auto;
	border-inline-end: 0;
}

.pos-unified-header--tablet .pos-header-nav-zone--tablet {
	width: 100%;
	flex: 1 1 auto;
}

.pos-unified-header--tablet .pos-header-nav-capsule--tablet {
	width: 100%;
	height: var(--pos-header-nav-height-compact);
	overflow-x: auto;
	scrollbar-width: none;
}

.pos-unified-header--tablet .pos-header-nav-capsule--tablet::-webkit-scrollbar {
	display: none;
}

.pos-unified-header--tablet .pos-unified-header__row--main {
	justify-content: space-between;
}

.pos-unified-header--mobile .pos-unified-header__shell {
	padding: 7px 9px;
}

.pos-unified-header--mobile .pos-unified-header__row--main {
	gap: 6px;
}

.pos-unified-header--mobile .pos-header-brand {
	min-width: 0;
	max-width: none;
	height: 42px;
	border-inline-end: 0;
	padding: 0;
	flex: 1 1 auto;
}

.pos-unified-header--mobile .pos-header-brand__mark {
	width: 34px;
	height: 34px;
	flex-basis: 34px;
}

.pos-unified-header--mobile .pos-header-brand__title {
	font-size: var(--pos-header-brand-title-size-mobile);
}

.pos-unified-header--mobile .pos-header-brand__company {
	display: none;
}

.pos-unified-header--mobile .pos-header-actions {
	gap: 4px;
	flex: 0 0 auto;
}

.pos-unified-header--mobile .pos-header-offline-btn,
.pos-unified-header--mobile .pos-header-cashier-btn {
	display: none !important;
}

@media (max-width: 390px) {
	.pos-unified-header--mobile .pos-header-brand__copy {
		display: none;
	}

	.pos-unified-header--mobile .pos-header-brand {
		flex: 0 0 auto;
	}
}

.loading-container {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	z-index: 1000;
}

.glass-card {
	position: absolute;
	top: -40px;
	left: 12px;
	right: 12px;
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 8px 16px;
	background: color-mix(in srgb, var(--pos-surface-raised) 86%, transparent);
	backdrop-filter: blur(20px);
	border-radius: 12px;
	border: 1px solid var(--pos-border-light);
	box-shadow: 0 8px 32px rgba(15, 23, 42, 0.1);
}

.loading-message {
	font-size: 12px;
	font-weight: 600;
	color: var(--pos-primary);
	flex: 1;
}

.progress-badge {
	font-size: 11px;
	font-weight: 700;
	color: var(--pos-on-primary);
	background: var(--pos-primary);
	padding: 2px 8px;
	border-radius: 8px;
	min-width: 32px;
	text-align: center;
}

.glass-progress {
	border-radius: 0 !important;
}

.loading-fade-enter-active,
.loading-fade-leave-active {
	transition: all 0.2s ease;
}

.loading-fade-enter-from,
.loading-fade-leave-to {
	opacity: 0;
	transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
	.pos-unified-header,
	.pos-header-control,
	.pos-header-nav-item,
	.loading-fade-enter-active,
	.loading-fade-leave-active {
		transition: none !important;
		animation: none !important;
	}
}
</style>
