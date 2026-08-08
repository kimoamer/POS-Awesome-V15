<template>
	<div class="barcode-page h-100 d-flex flex-column bg-background overflow-hidden">
		<!-- Header -->
		<div class="barcode-header border-b px-4 py-2 bg-surface d-flex align-center justify-space-between flex-wrap ga-2 flex-shrink-0">
			<div class="d-flex align-center ga-2">
				<div class="purchase-header-icon-box">
					<v-icon icon="mdi-barcode-scan" color="primary" size="20" />
				</div>
				<span class="text-h6 font-weight-bold text-primary mb-0">
					{{ __("Barcode Label Printing") }}
				</span>
			</div>

			<div class="d-flex align-center ga-2 flex-wrap">
				<v-btn-toggle v-model="viewMode" mandatory density="compact" color="primary" variant="outlined" divided class="rounded-lg">
					<v-btn value="labels" size="small" class="text-none font-weight-bold">
						<v-icon start size="16">mdi-format-list-bulleted</v-icon>
						<span>{{ __("Labels") }}</span>
					</v-btn>
					<v-btn value="designer" size="small" class="text-none font-weight-bold">
						<v-icon start size="16">mdi-drag-variant</v-icon>
						<span>{{ __("Designer") }}</span>
					</v-btn>
				</v-btn-toggle>

				<v-btn
					v-if="viewMode === 'labels'"
					color="primary"
					variant="elevated"
					size="small"
					class="font-weight-bold text-none rounded-lg"
					prepend-icon="mdi-plus-box-outline"
					@click="itemsSelectorDialog = true"
				>
					{{ __("Select Items") }}
				</v-btn>

				<!-- More Actions Menu -->
				<v-menu>
					<template v-slot:activator="{ props: menuProps }">
						<v-btn
							v-bind="menuProps"
							variant="outlined"
							color="primary"
							size="small"
							class="font-weight-bold border-primary text-none"
							append-icon="mdi-chevron-down"
						>
							{{ __("More") }}
						</v-btn>
					</template>
					<v-list density="compact" class="rounded-lg shadow-sm">
						<v-list-item @click="ssccDialog = true">
							<template #prepend><v-icon color="primary" size="18">mdi-truck-delivery-outline</v-icon></template>
							<v-list-item-title class="font-weight-bold">{{ __("SSCC-18 Shipping Labels") }}</v-list-item-title>
						</v-list-item>
						<v-list-item @click="verificationDialog = true">
							<template #prepend><v-icon color="primary" size="18">mdi-shield-check-outline</v-icon></template>
							<v-list-item-title class="font-weight-bold">{{ __("Barcode Verification") }}</v-list-item-title>
						</v-list-item>
						<v-divider class="my-1"></v-divider>
						<v-list-item @click="onExportPng" :disabled="!items.length">
							<template #prepend><v-icon color="primary" size="18">mdi-image</v-icon></template>
							<v-list-item-title class="font-weight-bold">{{ __("Export PNG Image") }}</v-list-item-title>
						</v-list-item>
						<v-list-item @click="onExportSvg" :disabled="!items.length">
							<template #prepend><v-icon color="primary" size="18">mdi-svg</v-icon></template>
							<v-list-item-title class="font-weight-bold">{{ __("Export SVG Vector") }}</v-list-item-title>
						</v-list-item>
						<v-list-item @click="onExportCsv" :disabled="!items.length">
							<template #prepend><v-icon color="primary" size="18">mdi-file-delimited</v-icon></template>
							<v-list-item-title class="font-weight-bold">{{ __("Export CSV Spreadsheet") }}</v-list-item-title>
						</v-list-item>
						<v-divider class="my-1"></v-divider>
						<v-list-item @click="importDialog = true">
							<template #prepend><v-icon color="primary" size="18">mdi-file-import-outline</v-icon></template>
							<v-list-item-title class="font-weight-bold">{{ __("Import from Document") }}</v-list-item-title>
						</v-list-item>
						<v-list-item @click="bulkImportDialog = true">
							<template #prepend><v-icon color="primary" size="18">mdi-upload-outline</v-icon></template>
							<v-list-item-title class="font-weight-bold">{{ __("Bulk Import Barcodes") }}</v-list-item-title>
						</v-list-item>
					</v-list>
				</v-menu>

				<!-- Clear Queue Button -->
				<v-btn
					variant="outlined"
					color="error"
					size="small"
					prepend-icon="mdi-delete-outline"
					class="font-weight-bold border-error text-none"
					@click="clearAll"
				>
					{{ __("Clear Queue") }}
				</v-btn>
			</div>
		</div>

		<!-- LABELS MODE WORKSPACE -->
		<div v-if="viewMode === 'labels'" class="barcode-labels-workspace">
			<!-- Main Workspace: Queue Cards & Settings -->
			<main class="barcode-labels-pane">
				<div class="barcode-labels-content">
					<!-- Queue Column (Left) -->
					<section class="barcode-queue-column">
						<header class="barcode-queue-header">
							<div class="d-flex align-center ga-3">
								<h3 class="text-subtitle-1 font-weight-bold text-primary mb-0 d-flex align-center ga-2">
									<v-icon size="20">mdi-tray-full</v-icon>
									{{ __("LABELS QUEUE") }} (<bdi>{{ items.length }}</bdi>)
								</h3>
								<v-btn
									color="primary"
									variant="tonal"
									size="small"
									class="font-weight-bold text-none rounded-lg"
									prepend-icon="mdi-plus"
									@click="itemsSelectorDialog = true"
								>
									{{ __("Add Items") }}
								</v-btn>
							</div>
							<span class="text-caption text-medium-emphasis">
								{{ __("Total Labels") }}: <strong class="text-primary">{{ totalLabelsCount }}</strong>
							</span>
						</header>

						<!-- Compact Cards Rows -->
						<div v-if="items.length" class="barcode-items-queue-list">
							<v-card
								v-for="item in items"
								:key="item._row_id"
								class="mb-3 pa-3 border rounded-lg pos-themed-card"
								flat
							>
								<div class="d-flex align-start justify-space-between ga-2 mb-2">
									<div class="d-flex align-center ga-2 min-w-0">
										<v-avatar size="32" color="grey-lighten-4" class="border flex-shrink-0">
											<v-icon icon="mdi-barcode-scan" color="primary" size="18" />
										</v-avatar>
										<div class="text-truncate">
											<div class="font-weight-bold text-subtitle-2 text-truncate" :title="item.item_name">
												{{ item.item_name }}
											</div>
											<div class="text-caption text-medium-emphasis">
												{{ item.item_code }} <span v-if="item.barcode">· {{ item.barcode }}</span>
											</div>
										</div>
									</div>

									<div class="d-flex align-center ga-2 flex-shrink-0">
										<strong class="text-subtitle-1 font-weight-bold text-primary">
											{{ formatCurrency(item.price) }}
										</strong>
										<v-btn
											icon="mdi-delete-outline"
											variant="text"
											color="error"
											size="small"
											@click="removeItem(item)"
											:title="__('Remove item')"
										></v-btn>
									</div>
								</div>

								<div class="d-flex flex-wrap align-center ga-2 border-t pt-2 mt-1">
									<div class="flex-grow-1" style="min-width: 110px;">
										<label class="text-caption text-medium-emphasis d-block mb-1">{{ __("UOM") }}</label>
										<v-select
											v-if="getItemUomOptions(item).length"
											v-model="item.uom"
											:items="getItemUomOptions(item)"
											density="compact"
											variant="outlined"
											hide-details
											class="pos-themed-input"
											@update:modelValue="onItemUomChange(item)"
										></v-select>
										<span v-else class="text-caption text-medium-emphasis">-</span>
									</div>

									<div class="flex-grow-1" style="min-width: 120px;">
										<label class="text-caption text-medium-emphasis d-block mb-1">
											{{ shouldShowScaleGramsInput(item) ? __("Labels Qty") : __("Quantity") }}
										</label>
										<div class="d-flex align-center border rounded px-1" style="height: 36px;">
											<v-btn icon="mdi-minus" variant="text" size="x-small" @click="decrementQty(item)"></v-btn>
											<span class="flex-grow-1 text-center font-weight-bold text-body-2">{{ item.qty }}</span>
											<v-btn icon="mdi-plus" variant="text" size="x-small" @click="incrementQty(item)"></v-btn>
										</div>
									</div>

									<div v-if="shouldShowScaleGramsInput(item)" class="flex-grow-1" style="min-width: 90px;">
										<label class="text-caption text-medium-emphasis d-block mb-1">{{ __("Weight (g)") }}</label>
										<v-text-field
											v-model.number="item.scaleGrams"
											density="compact"
											variant="outlined"
											hide-details
											type="number"
											class="pos-themed-input"
										></v-text-field>
									</div>

									<div class="flex-grow-1" style="min-width: 140px;">
										<label class="text-caption text-medium-emphasis d-block mb-1">{{ __("Location") }}</label>
										<v-autocomplete
											v-model="item.warehouseLocation"
											:items="warehouseOptions"
											item-title="warehouse_name"
											item-value="name"
											density="compact"
											variant="outlined"
											hide-details
											class="pos-themed-input"
											:placeholder="__('Loc')"
											clearable
										></v-autocomplete>
									</div>
								</div>
							</v-card>
						</div>

						<div v-else class="barcode-queue-empty">
							<v-icon size="56" color="primary" class="mb-3 opacity-75">mdi-barcode-scan</v-icon>
							<div class="font-weight-bold text-h6 text-high-emphasis mb-1">{{ __("No barcode items added yet") }}</div>
							<div class="text-body-2 text-medium-emphasis mb-4" style="max-width: 360px;">
								{{ __("Click below to open the catalog popup and choose items to add to the print queue.") }}
							</div>
							<v-btn
								color="primary"
								size="large"
								variant="elevated"
								class="font-weight-bold text-none rounded-lg px-6"
								prepend-icon="mdi-plus-circle-outline"
								@click="itemsSelectorDialog = true"
							>
								{{ __("Select Items from Catalog") }}
							</v-btn>
						</div>
					</section>

					<!-- Controls Column (Right) -->
					<aside class="barcode-settings-column">
						<!-- Scrollable settings body -->
						<div class="barcode-settings-scroll">
						<!-- PRINT SETUP CARD -->
						<v-card class="barcode-settings-card border rounded-lg pos-themed-card" flat>
							<h4 class="text-subtitle-2 font-weight-bold text-primary mb-3 d-flex align-center ga-2">
								<v-icon size="18">mdi-printer-settings</v-icon>
								{{ __("PRINT SETUP") }}
							</h4>

							<div class="barcode-print-setup-grid">
								<div class="print-field--full">
									<label class="barcode-settings-label">{{ __("Page Format") }}</label>
									<v-select
										v-model="pageFormat"
										:items="PAGE_FORMAT_PRESETS"
										item-title="label"
										item-value="value"
										density="compact"
										variant="outlined"
										hide-details
										class="pos-themed-input"
									></v-select>
								</div>

								<template v-if="pageFormat === 'A4'">
									<div>
										<label class="barcode-settings-label">{{ __("Columns") }}</label>
										<v-text-field v-model.number="gridCols" type="number" density="compact" variant="outlined" hide-details class="pos-themed-input" min="1"></v-text-field>
									</div>
									<div>
										<label class="barcode-settings-label">{{ __("Rows") }}</label>
										<v-text-field v-model.number="gridRows" type="number" density="compact" variant="outlined" hide-details class="pos-themed-input" min="1"></v-text-field>
									</div>
								</template>

								<div>
									<label class="barcode-settings-label">{{ __("Symbology") }}</label>
									<v-select v-model="symbology" :items="symbologyOptions" density="compact" variant="outlined" hide-details class="pos-themed-input"></v-select>
								</div>

								<div>
									<label class="barcode-settings-label">{{ __("Output") }}</label>
									<v-select v-model="outputFormat" :items="['html', 'zpl', 'epl']" density="compact" variant="outlined" hide-details class="pos-themed-input"></v-select>
								</div>

								<div class="print-field--full">
									<label class="barcode-settings-label">{{ __("Printer Profile") }}</label>
									<v-select
										v-model="selectedPrinterProfile"
										:items="printerProfiles"
										item-title="printer_name"
										return-object
										density="compact"
										variant="outlined"
										hide-details
										class="pos-themed-input"
										clearable
										@update:modelValue="onPrinterProfileChange"
									></v-select>
								</div>

								<div class="print-field--full">
									<label class="barcode-settings-label">{{ __("DPI Resolution") }}</label>
									<v-select
										v-model="printerDpi"
										:items="[
											{ title: '96 DPI (Browser)', value: 96 },
											{ title: '203 DPI (Thermal)', value: 203 },
											{ title: '300 DPI (High)', value: 300 },
										]"
										density="compact"
										variant="outlined"
										hide-details
										class="pos-themed-input"
									></v-select>
								</div>
							</div>
						</v-card>

						<!-- Size Warnings (relevant to print setup) -->
						<v-alert v-if="sizeWarnings.length" type="warning" density="compact" variant="tonal" class="mb-3">
							{{ sizeWarnings[0] }}
						</v-alert>

						<!-- CONTENT OPTIONS CARD -->
						<v-card class="barcode-settings-card border rounded-lg pos-themed-card" flat>
							<h4 class="text-subtitle-2 font-weight-bold text-primary mb-3 d-flex align-center ga-2">
								<v-icon size="18">mdi-checkbox-multiple-marked-outline</v-icon>
								{{ __("CONTENT OPTIONS") }}
							</h4>

							<div class="barcode-content-options-grid">
								<v-checkbox v-model="includePrice" :label="__('Include Price')" density="compact" hide-details color="primary"></v-checkbox>
								<v-checkbox v-model="serializationEnabled" :label="__('Serialization')" density="compact" hide-details color="primary"></v-checkbox>
								<v-checkbox v-model="includeBatchSerial" :label="__('Include Batch / Serial')" density="compact" hide-details color="primary"></v-checkbox>
								<v-checkbox v-model="includeWarehouseLocation" :label="__('Include Warehouse Location')" density="compact" hide-details color="primary"></v-checkbox>
								<v-checkbox v-model="rfidEnabled" :label="__('RFID Encode (ZPL)')" density="compact" hide-details color="primary" :disabled="outputFormat !== 'zpl'"></v-checkbox>
								<div v-if="rfidEnabled" class="print-field--full mt-1">
									<v-text-field
										v-model="rfidEpcPrefix"
										:label="__('EPC Prefix (Hex)')"
										density="compact"
										variant="outlined"
										hide-details
										class="pos-themed-input"
										placeholder="303402B4DD"
									></v-text-field>
								</div>
							</div>
						</v-card>

						<v-alert v-if="hasActiveTemplate" type="info" density="compact" variant="tonal" class="mb-3" closable @click:close="clearDesignerTemplate">
							<div class="d-flex align-center justify-space-between flex-wrap ga-1">
								<span>{{ __("Designer template active") }}</span>
								<div>
									<v-btn variant="text" size="x-small" color="primary" class="text-none font-weight-bold" @click="viewMode = 'designer'">{{ __("Edit") }}</v-btn>
									<v-btn variant="text" size="x-small" color="error" class="text-none font-weight-bold" @click="clearDesignerTemplate">{{ __("Clear") }}</v-btn>
								</div>
							</div>
						</v-alert>
						</div><!-- end barcode-settings-scroll -->

						<!-- Fixed Output Actions Footer -->
						<footer class="barcode-output-actions">
							<v-btn color="info" variant="tonal" block height="36" class="font-weight-bold text-none mb-2" @click="openPreview" :disabled="!items.length">
								<v-icon start size="16">mdi-eye-outline</v-icon>
								{{ __("Preview Labels") }}
							</v-btn>
							<div class="d-flex ga-2">
								<v-btn color="secondary" class="flex-grow-1 font-weight-bold text-none" height="38" @click="downloadPdf(items)" :disabled="!items.length">
									<v-icon start size="16">mdi-file-pdf-box</v-icon>
									{{ __("PDF") }}
								</v-btn>
								<v-btn color="primary" class="flex-grow-1 font-weight-bold text-none" height="38" @click="printLabels(items)" :disabled="!items.length">
									<v-icon start size="16">mdi-printer</v-icon>
									{{ __("Print") }}
								</v-btn>
								<v-btn color="deep-purple-accent-3" class="flex-grow-1 font-weight-bold text-none" height="38" @click="thermalPrint" :disabled="!items.length || !qzThermalAvailable" :loading="thermalPrinting">
									<v-icon start size="16">mdi-fire</v-icon>
									{{ __("Thermal") }}
								</v-btn>
							</div>
						</footer>
					</aside>
				</div>
			</main>
		</div>

		<!-- DESIGNER MODE WORKSPACE -->
		<div v-else-if="viewMode === 'designer'" class="barcode-designer-workspace">
			<main class="barcode-designer-main">
				<LabelDesigner
					:designer="designer"
					@select="(id) => designer.selectObject(id)"
					@dblclick="() => {}"
				/>
			</main>

			<aside class="barcode-designer-properties">
				<LabelDesignerPanel
					:object="designer.selectedObject.value"
					@change="onDesignerObjectChange"
					@uploadImage="onUploadImage"
				/>
			</aside>

			<footer class="barcode-designer-footer">
				<div class="barcode-designer-footer__left">
					<v-btn variant="text" prepend-icon="mdi-arrow-left" @click="viewMode = 'labels'">
						{{ __("Back to Labels") }}
					</v-btn>
					<v-btn variant="outlined" prepend-icon="mdi-upload" @click="importDesignerLayout">
						{{ __("Import Layout") }}
					</v-btn>
				</div>
				<div class="barcode-designer-footer__right">
					<v-btn variant="outlined" color="primary" prepend-icon="mdi-folder-open-outline" @click="templateLibraryDialog = true">
						{{ __("Load Template") }}
					</v-btn>
					<v-btn variant="outlined" color="primary" prepend-icon="mdi-content-save-outline" @click="saveTemplateDialog = true">
						{{ __("Save Template") }}
					</v-btn>
					<v-btn color="success" prepend-icon="mdi-check" @click="applyDesignerTemplate">
						{{ hasActiveTemplate ? __("Update Template") : __("Use as Template") }}
					</v-btn>
					<v-btn variant="outlined" color="primary" prepend-icon="mdi-download" @click="exportDesignerLayout">
						{{ __("Export") }}
					</v-btn>
				</div>
			</footer>
		</div>

		<!-- Save Template Dialog -->
		<v-dialog v-model="saveTemplateDialog" max-width="460" transition="dialog-bottom-transition">
			<v-card class="rounded-2xl border elevation-6 overflow-hidden pos-themed-card">
				<v-card-title class="bg-surface border-b pa-4 d-flex align-center justify-space-between">
					<div class="d-flex align-center ga-3">
						<v-avatar color="primary" variant="tonal" size="40" class="rounded-xl">
							<v-icon size="22">mdi-content-save-outline</v-icon>
						</v-avatar>
						<div>
							<div class="text-subtitle-1 font-weight-bold text-high-emphasis mb-0">
								{{ __("Save Label Template") }}
							</div>
							<div class="text-caption text-medium-emphasis">
								{{ __("Save custom layout for future barcode printing") }}
							</div>
						</div>
					</div>
					<v-btn icon="mdi-close" variant="tonal" color="medium-emphasis" size="small" class="rounded-circle" @click="saveTemplateDialog = false"></v-btn>
				</v-card-title>
				<v-card-text class="pa-5">
					<v-text-field v-model="saveTemplateTitle" :label="__('Template Title')" variant="outlined" density="compact" class="mb-3 pos-themed-input rounded-lg" autofocus></v-text-field>
					<v-textarea v-model="saveTemplateDescription" :label="__('Description (optional)')" variant="outlined" density="compact" rows="2" class="pos-themed-input rounded-lg" hide-details></v-textarea>
				</v-card-text>
				<v-card-actions class="bg-surface border-t pa-3 px-4 justify-end ga-2">
					<v-btn variant="outlined" color="medium-emphasis" class="px-5 font-weight-bold text-none rounded-lg" @click="saveTemplateDialog = false">{{ __("Cancel") }}</v-btn>
					<v-btn color="primary" variant="elevated" class="px-6 font-weight-bold text-none rounded-lg" :loading="saveTemplateLoading" @click="onSaveTemplate">{{ __("Save Template") }}</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<!-- Items Selector Popup Dialog -->
		<v-dialog v-model="itemsSelectorDialog" max-width="1100" height="85vh" scrollable transition="dialog-bottom-transition">
			<v-card class="rounded-2xl border elevation-6 overflow-hidden d-flex flex-column h-100 pos-themed-card">
				<v-card-title class="bg-surface border-b pa-4 d-flex align-center justify-space-between flex-shrink-0">
					<div class="d-flex align-center ga-3">
						<v-avatar color="primary" variant="tonal" size="42" class="rounded-xl">
							<v-icon size="24">mdi-shape-plus-outline</v-icon>
						</v-avatar>
						<div>
							<div class="text-h6 font-weight-bold text-high-emphasis mb-0">
								{{ __("Select Items for Barcode Printing") }}
							</div>
							<div class="text-caption text-medium-emphasis">
								{{ __("Browse or search catalog items to add labels to your print queue") }}
							</div>
						</div>
					</div>
					<v-btn icon="mdi-close" variant="tonal" color="medium-emphasis" size="small" class="rounded-circle" @click="itemsSelectorDialog = false"></v-btn>
				</v-card-title>
				<v-card-text class="pa-0 flex-grow-1 overflow-hidden" style="position: relative;">
					<ItemsSelector
						context="barcode"
						:show-only-barcode-items="true"
						class="h-100"
						@add-item="onAddItem"
						@add-items="onAddItems"
					/>
				</v-card-text>
				<v-card-actions class="bg-surface border-t pa-3 px-4 justify-space-between flex-shrink-0">
					<div class="d-flex align-center ga-2 text-caption text-medium-emphasis">
						<v-icon size="16" color="primary">mdi-information-outline</v-icon>
						<span>{{ __("Items added will appear in the label queue automatically.") }}</span>
					</div>
					<v-btn color="primary" variant="elevated" size="large" class="px-6 font-weight-bold text-none rounded-lg" @click="itemsSelectorDialog = false">
						<v-icon start size="18">mdi-check</v-icon>
						{{ __("Done") }}
					</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<!-- Template Library Dialog -->
		<TemplateLibrary v-model="templateLibraryDialog" @load="loadTemplateFromLibrary" />

		<!-- Barcode Verification Dialog -->
		<VerificationDialog v-model="verificationDialog" />

		<!-- Add Item Quantity Dialog -->
		<v-dialog v-model="addItemDialog" max-width="440" transition="dialog-bottom-transition">
			<v-card v-if="pendingAddItem" class="rounded-2xl border elevation-6 overflow-hidden pos-themed-card">
				<v-card-title class="bg-surface border-b pa-4 d-flex align-center justify-space-between">
					<div class="d-flex align-center ga-3 min-w-0">
						<v-avatar color="primary" variant="tonal" size="40" class="rounded-xl flex-shrink-0">
							<v-icon size="22">mdi-numeric</v-icon>
						</v-avatar>
						<div class="min-w-0">
							<div class="text-subtitle-1 font-weight-bold text-high-emphasis text-truncate mb-0">
								{{ pendingAddItem.item_name }}
							</div>
							<div class="text-caption text-medium-emphasis text-truncate">
								{{ pendingAddItem.item_code }}
							</div>
						</div>
					</div>
					<v-btn icon="mdi-close" variant="tonal" color="medium-emphasis" size="small" class="rounded-circle" @click="closeAddItemDialog"></v-btn>
				</v-card-title>

				<v-card-text class="pa-5">
					<v-alert
						v-if="pendingAddItem && shouldShowScaleGramsInput(pendingAddItem)"
						type="info"
						density="compact"
						variant="tonal"
						class="mb-4 rounded-lg"
						icon="mdi-scale"
					>
						{{ __("Scale barcode detected. Set label quantity and weight.") }}
					</v-alert>

					<div class="d-flex flex-column ga-3">
						<v-select
							v-if="pendingAddItem && getItemUomOptions(pendingAddItem).length > 1"
							v-model="pendingAddItem.uom"
							:items="getItemUomOptions(pendingAddItem)"
							:label="__('Unit of Measure (UOM)')"
							variant="outlined"
							density="compact"
							hide-details
							class="pos-themed-input rounded-lg"
							@update:modelValue="onPendingUomChange"
						></v-select>

						<div>
							<label class="text-caption font-weight-bold text-medium-emphasis d-block mb-1">
								{{ pendingAddItem && shouldShowScaleGramsInput(pendingAddItem) ? __('Labels Quantity') : __('Quantity') }}
							</label>
							<v-text-field
								v-model.number="addItemQty"
								type="number"
								min="1"
								step="1"
								variant="outlined"
								density="compact"
								hide-details
								class="pos-themed-input rounded-lg"
								autofocus
								@keydown.enter="confirmAddItem"
							></v-text-field>
						</div>

						<div v-if="pendingAddItem && shouldShowScaleGramsInput(pendingAddItem)">
							<label class="text-caption font-weight-bold text-medium-emphasis d-block mb-1">
								{{ __('Weight (Grams)') }}
							</label>
							<v-text-field
								v-model.number="pendingScaleGrams"
								type="number"
								min="1"
								step="1"
								variant="outlined"
								density="compact"
								hide-details
								class="pos-themed-input rounded-lg"
								@update:modelValue="onPendingScaleGramsInput"
								@blur="syncPendingScaleBarcode"
								@keydown.enter.prevent="syncPendingScaleBarcode"
							></v-text-field>
						</div>

						<div
							v-if="pendingAddItem && shouldShowScaleGramsInput(pendingAddItem) && pendingAddItem.barcode"
							class="text-caption text-primary font-weight-medium bg-primary-subtle pa-2 rounded-lg d-flex align-center ga-1"
						>
							<v-icon size="16">mdi-barcode</v-icon>
							<span>{{ __("Barcode: {0}", [pendingAddItem.barcode]) }}</span>
						</div>
					</div>
				</v-card-text>

				<v-card-actions class="bg-surface border-t pa-3 px-4 justify-end ga-2">
					<v-btn variant="outlined" color="medium-emphasis" class="px-5 font-weight-bold text-none rounded-lg" @click="closeAddItemDialog">
						{{ __("Cancel") }}
					</v-btn>
					<v-btn color="primary" variant="elevated" class="px-6 font-weight-bold text-none rounded-lg" @click="confirmAddItem">
						<v-icon start size="18">mdi-plus</v-icon>
						{{ __("Add to Queue") }}
					</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
		<!-- Variable Data Dialog -->
		<v-dialog v-model="variableDataDialog" max-width="460" transition="dialog-bottom-transition">
			<v-card v-if="variableDataItem" class="rounded-2xl border elevation-6 overflow-hidden pos-themed-card">
				<v-card-title class="bg-surface border-b pa-4 d-flex align-center justify-space-between">
					<div class="d-flex align-center ga-3 min-w-0">
						<v-avatar color="primary" variant="tonal" size="40" class="rounded-xl flex-shrink-0">
							<v-icon size="22">mdi-variable</v-icon>
						</v-avatar>
						<div class="min-w-0">
							<div class="text-subtitle-1 font-weight-bold text-high-emphasis text-truncate mb-0">
								{{ __("Variable Data") }}
							</div>
							<div class="text-caption text-medium-emphasis text-truncate">
								{{ variableDataItem.item_name }}
							</div>
						</div>
					</div>
					<v-btn icon="mdi-close" variant="tonal" color="medium-emphasis" size="small" class="rounded-circle" @click="closeVariableDataDialog"></v-btn>
				</v-card-title>
				<v-card-text class="pa-5">
					<div class="d-flex flex-column ga-3">
						<v-autocomplete
							v-if="getAvailableBatches(variableDataItem).length"
							v-model="variableDataItem.batch_no"
							:items="getAvailableBatches(variableDataItem)"
							item-title="batch_no"
							item-value="batch_no"
							:label="__('Batch No')"
							variant="outlined"
							density="compact"
							hide-details
							class="pos-themed-input rounded-lg"
							clearable
							@update:modelValue="onSelectBatch(variableDataItem, $event)"
						></v-autocomplete>
						<v-text-field
							v-else
							v-model="variableDataItem.batch_no"
							:label="__('Batch No')"
							variant="outlined"
							density="compact"
							hide-details
							class="pos-themed-input rounded-lg"
						></v-text-field>

						<v-autocomplete
							v-if="getAvailableSerials(variableDataItem).length"
							v-model="variableDataItem.serial_no"
							:items="getAvailableSerials(variableDataItem)"
							item-title="serial_no"
							item-value="serial_no"
							:label="__('Serial No')"
							:hint="__('e.g. 1001-1050')"
							persistent-hint
							variant="outlined"
							density="compact"
							class="pos-themed-input rounded-lg"
							clearable
							@update:modelValue="onSelectSerial(variableDataItem, $event)"
						></v-autocomplete>
						<v-text-field
							v-else
							v-model="variableDataItem.serial_no"
							:label="__('Serial No')"
							:hint="__('e.g. 1001-1050')"
							persistent-hint
							variant="outlined"
							density="compact"
							class="pos-themed-input rounded-lg"
						></v-text-field>

						<v-text-field
							v-model="variableDataItem.expiry_date"
							:label="__('Expiry Date')"
							:hint="__('Auto-filled when batch selected')"
							persistent-hint
							type="date"
							variant="outlined"
							density="compact"
							class="pos-themed-input rounded-lg"
						></v-text-field>

						<v-autocomplete
							v-model="variableDataItem.warehouseLocation"
							:items="warehouseOptions"
							item-title="warehouse_name"
							item-value="name"
							:label="__('Location')"
							:loading="warehouseLoading"
							:hint="__('Choose warehouse location')"
							persistent-hint
							variant="outlined"
							density="compact"
							class="pos-themed-input rounded-lg"
							clearable
						></v-autocomplete>
					</div>
				</v-card-text>
				<v-card-actions class="bg-surface border-t pa-3 px-4 justify-end ga-2">
					<v-btn variant="outlined" color="medium-emphasis" class="px-5 font-weight-bold text-none rounded-lg" @click="closeVariableDataDialog">{{ __("Cancel") }}</v-btn>
					<v-btn color="primary" variant="elevated" class="px-6 font-weight-bold text-none rounded-lg" @click="closeVariableDataDialog">{{ __("Save Changes") }}</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
		<!-- Bulk Import Dialog -->
		<v-dialog v-model="bulkImportDialog" max-width="620" transition="dialog-bottom-transition">
			<v-card class="rounded-2xl border elevation-6 overflow-hidden pos-themed-card">
				<v-card-title class="bg-surface border-b pa-4 d-flex align-center justify-space-between">
					<div class="d-flex align-center ga-3">
						<v-avatar color="primary" variant="tonal" size="40" class="rounded-xl">
							<v-icon size="22">mdi-upload-outline</v-icon>
						</v-avatar>
						<div>
							<div class="text-subtitle-1 font-weight-bold text-high-emphasis mb-0">
								{{ __("Bulk Import Barcodes") }}
							</div>
							<div class="text-caption text-medium-emphasis">
								{{ __("Paste CSV or JSON list of items to add in bulk") }}
							</div>
						</div>
					</div>
					<v-btn icon="mdi-close" variant="tonal" color="medium-emphasis" size="small" class="rounded-circle" @click="bulkImportDialog = false"></v-btn>
				</v-card-title>
				<v-card-text class="pa-5">
					<v-radio-group v-model="bulkImportFormat" inline hide-details density="compact" class="mb-3">
						<v-radio :label="__('CSV')" value="csv" color="primary"></v-radio>
						<v-radio :label="__('JSON')" value="json" color="primary"></v-radio>
					</v-radio-group>
					<v-textarea
						v-model="bulkImportRaw"
						:label="bulkImportFormat === 'csv' ? __('item_code, qty') : __('[{item_code:..., qty:...}]')"
						variant="outlined"
						rows="6"
						:hint="bulkImportFormat === 'csv' ? __('One per line: item_code, qty') : __('Array of objects with item_code, qty')"
						persistent-hint
						class="pos-themed-input rounded-lg mb-3"
					></v-textarea>
					<v-alert v-if="bulkImportError" type="error" density="compact" variant="tonal" class="mb-2 rounded-lg">
						{{ bulkImportError }}
					</v-alert>
					<v-alert v-if="bulkImportSuccess" type="success" density="compact" variant="tonal" class="mb-2 rounded-lg">
						{{ bulkImportSuccess }}
					</v-alert>
				</v-card-text>
				<v-card-actions class="bg-surface border-t pa-3 px-4 justify-end ga-2">
					<v-btn variant="outlined" color="medium-emphasis" class="px-5 font-weight-bold text-none rounded-lg" @click="bulkImportDialog = false">{{ __("Cancel") }}</v-btn>
					<v-btn color="primary" variant="elevated" class="px-6 font-weight-bold text-none rounded-lg" :loading="bulkImporting" @click="processBulkImport">
						{{ __("Import Barcodes") }}
					</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<ImportSourceDialog v-model="importDialog" @import="onImportFromSource" />

		<!-- SSCC-18 Shipping Label Generator Dialog -->
		<v-dialog v-model="ssccDialog" max-width="580" transition="dialog-bottom-transition">
			<v-card class="rounded-2xl border elevation-6 overflow-hidden pos-themed-card">
				<v-card-title class="bg-surface border-b pa-4 d-flex align-center justify-space-between">
					<div class="d-flex align-center ga-3">
						<v-avatar color="primary" variant="tonal" size="40" class="rounded-xl">
							<v-icon size="22">mdi-truck-delivery-outline</v-icon>
						</v-avatar>
						<div>
							<div class="text-subtitle-1 font-weight-bold text-high-emphasis mb-0">
								{{ __("Generate SSCC-18 Shipping Labels") }}
							</div>
							<div class="text-caption text-medium-emphasis">
								{{ __("Create GS1 compliant logistical serial shipping container codes") }}
							</div>
						</div>
					</div>
					<v-btn icon="mdi-close" variant="tonal" color="medium-emphasis" size="small" class="rounded-circle" @click="ssccDialog = false"></v-btn>
				</v-card-title>
				<v-card-text class="pt-4">
					<v-row dense>
						<v-col cols="12" md="6">
							<v-text-field
								v-model="ssccCompanyPrefix"
								:label="__('GS1 Company Prefix')"
								variant="outlined"
								density="compact"
								hide-details
								placeholder="1234567"
							></v-text-field>
						</v-col>
						<v-col cols="6" md="3">
							<v-select
								v-model="ssccExtensionDigit"
								:items="['0','1','2','3','4','5','6','7','8','9']"
								:label="__('Extension')"
								variant="outlined"
								density="compact"
								hide-details
							></v-select>
						</v-col>
						<v-col cols="6" md="3">
							<v-text-field
								v-model.number="ssccCount"
								:label="__('Count')"
								type="number"
								min="1"
								max="100"
								variant="outlined"
								density="compact"
								hide-details
							></v-text-field>
						</v-col>
					</v-row>
					<v-row dense class="mt-2">
						<v-col cols="12" md="6">
							<v-text-field
								v-model="ssccDocumentRef"
								:label="__('Delivery Note / Sales Invoice (optional)')"
								variant="outlined"
								density="compact"
								hide-details
								:placeholder="__('e.g. DN-2024-001')"
							></v-text-field>
						</v-col>
						<v-col cols="12" md="6">
							<v-select
								v-model="ssccShipToType"
								:items="[
									{ title: __('Ship to Customer'), value: 'customer' },
									{ title: __('Ship from Company'), value: 'company' },
								]"
								:label="__('Address Source')"
								variant="outlined"
								density="compact"
								hide-details
								item-title="title"
								item-value="value"
							></v-select>
						</v-col>
					</v-row>
					<v-row dense class="mt-2" v-if="ssccGeneratedItems.length">
						<v-col cols="12">
							<v-divider class="mb-2"></v-divider>
							<div class="text-subtitle-2 mb-1">{{ __("Generated SSCC-18 Codes") }}</div>
							<v-list density="compact" class="border rounded">
								<v-list-item v-for="(gen, idx) in ssccGeneratedItems" :key="idx" density="compact">
									<template v-slot:prepend>
										<v-icon color="primary">mdi-barcode</v-icon>
									</template>
									<v-list-item-title class="font-family-mono">{{ gen.human_readable }}</v-list-item-title>
									<v-list-item-subtitle>{{ gen.sscc18 }}</v-list-item-subtitle>
									<template v-slot:append>
										<v-icon color="success" size="small">mdi-check-circle</v-icon>
									</template>
								</v-list-item>
							</v-list>
						</v-col>
					</v-row>
				</v-card-text>
				<v-card-actions class="bg-surface border-t pa-3 px-4 justify-space-between">
					<div>
						<v-btn v-if="ssccGeneratedItems.length" color="success" variant="elevated" prepend-icon="mdi-plus" @click="addSsccToQueue" class="font-weight-bold text-none rounded-lg">
							{{ __("Add {0} to Queue", [String(ssccGeneratedItems.length)]) }}
						</v-btn>
					</div>
					<div class="d-flex ga-2">
						<v-btn variant="outlined" color="medium-emphasis" class="px-5 font-weight-bold text-none rounded-lg" @click="ssccDialog = false">{{ __("Close") }}</v-btn>
						<v-btn color="primary" variant="elevated" class="px-6 font-weight-bold text-none rounded-lg" :loading="ssccGenerating" @click="generateSscc">
							<v-icon start size="18">mdi-barcode-scan</v-icon>
							{{ __("Generate") }}
						</v-btn>
					</div>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<!-- Label Preview Dialog -->
		<v-dialog v-model="previewDialog" fullscreen transition="dialog-bottom-transition">
			<v-card v-if="previewContent" class="d-flex flex-column h-100 pos-themed-card">
				<v-card-title class="bg-surface border-b pa-4 d-flex align-center justify-space-between flex-shrink-0">
					<div class="d-flex align-center ga-3">
						<v-avatar color="primary" variant="tonal" size="40" class="rounded-xl">
							<v-icon size="22">mdi-eye-outline</v-icon>
						</v-avatar>
						<div>
							<div class="text-h6 font-weight-bold text-high-emphasis mb-0">
								{{ __("Label Print Preview") }}
							</div>
							<div class="text-caption text-medium-emphasis">
								{{ __("Review label layout before printing or exporting") }}
							</div>
						</div>
					</div>
					<v-btn icon="mdi-close" variant="tonal" color="medium-emphasis" size="small" class="rounded-circle" @click="previewDialog = false"></v-btn>
				</v-card-title>
				<v-card-text class="flex-grow-1 pa-0 d-flex flex-column bg-grey-lighten-4">
					<iframe
						:srcdoc="previewContent"
						class="flex-grow-1"
						style="width: 100%; border: none;"
					></iframe>
				</v-card-text>
				<v-card-actions class="bg-surface border-t pa-3 px-4 justify-center ga-3 flex-shrink-0">
					<v-btn
						color="primary"
						variant="elevated"
						size="large"
						class="px-8 font-weight-bold text-none rounded-lg"
						prepend-icon="mdi-printer"
						@click="printFromPreview"
					>
						{{ __("Print") }}
					</v-btn>
					<v-btn
						color="secondary"
						variant="elevated"
						size="large"
						class="px-6 font-weight-bold text-none rounded-lg"
						prepend-icon="mdi-file-pdf-box"
						@click="pdfFromPreview"
					>
						{{ __("Download PDF") }}
					</v-btn>
					<v-btn
						variant="outlined"
						color="medium-emphasis"
						size="large"
						class="px-6 font-weight-bold text-none rounded-lg"
						@click="previewDialog = false"
					>
						{{ __("Close") }}
					</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted, ref } from "vue";
import ItemsSelector from "../items/ItemsSelector.vue";
import { useItemsStore } from "../../../stores/itemsStore";
import { useUIStore } from "../../../stores/uiStore";
import { useToastStore } from "../../../stores/toastStore";
import { useBarcodePrintQueue } from "../../../composables/pos/items/useBarcodePrintQueue";
import { useBarcodePrintOutput, PAGE_FORMAT_PRESETS, validateBarcodeItem, getBarcodeTypeLabel } from "../../../composables/pos/items/useBarcodePrintOutput";
import { useScaleBarcodeSettings } from "../../../composables/pos/items/useScaleBarcodeSettings";
import { useLabelDesigner } from "../../../composables/pos/items/useLabelDesigner";
import { useSsccGenerator } from "../../../composables/pos/items/useSsccGenerator";
import LabelDesigner from "./LabelDesigner.vue";
import LabelDesignerPanel from "./LabelDesignerPanel.vue";
import TemplateLibrary from "./TemplateLibrary.vue";
import VerificationDialog from "./VerificationDialog.vue";
import ImportSourceDialog from "./ImportSourceDialog.vue";
import { exportPng, exportSvg, exportCsv } from "../../../services/exportService";

const itemsStore = useItemsStore();
const uiStore = useUIStore();

const printQueue = useBarcodePrintQueue();
const printOutput = useBarcodePrintOutput();
const scaleSettings = useScaleBarcodeSettings();

const {
	items,
	editingQtyValue,
	addItemDialog,
	addItemQty,
	pendingAddItem,
	pendingScaleGrams,
	addOrMergePrintableItem,
	removeItem,
	clearAll,
	incrementQty,
	decrementQty,
	openQtyEdit,
	closeQtyEdit,
	onAddItem,
	confirmAddItem,
	closeAddItemDialog,
	onPendingUomChange,
	onPendingScaleGramsInput,
	syncPendingScaleBarcode,
	onItemScaleGramsChange,
	onItemUomChange,
	getItemUomOptions,
	getAvailableBarcodes,
	selectBarcode,
		variableDataDialog,
		variableDataItem,
		openVariableDataDialog,
		closeVariableDataDialog,
		warehouseOptions,
		warehouseLoading,
		getAvailableBatches,
		getAvailableSerials,
		onSelectBatch,
		onSelectSerial,
		importItems,
		serializationEngine,
		serializationEnabled,
		cleanup: cleanupQueue,
	} = printQueue;

const totalLabelsCount = computed(() => {
	return (items.value || []).reduce((acc: number, item: any) => acc + (Number(item.qty) || 0), 0);
});

const {
	pageFormat,
	gridCols,
	gridRows,
	includePrice,
	includeBatchSerial,
	includeWarehouseLocation,
	symbology,
	symbologyOptions,
	outputFormat,
	printerDpi,
	selectedPrinterProfile,
	printerProfiles,
	getPrintableItems,
	printLabels,
	printLabelsThermalWithFailover,
	printLabelsRawWithFailover,
	qzThermalAvailable,
	downloadPdf,
	getLabelSizeWarnings,
	formatCurrency,
	hasActiveTemplate,
	setDesignerTemplate,
	clearDesignerTemplate,
	fetchPrinterProfiles,
	applyPrinterProfile,
	rfidEnabled,
	rfidEpcPrefix,
	getEpcData,
} = printOutput;

const thermalPrinting = ref(false);
const itemsSelectorDialog = ref(false);
const importDialog = ref(false);
const bulkImportDialog = ref(false);
const bulkImportRaw = ref("");
const bulkImportFormat = ref("csv");
const bulkImporting = ref(false);
const bulkImportError = ref("");
const bulkImportSuccess = ref("");

const viewMode = ref<"labels" | "designer">("labels");
const designer = useLabelDesigner();

// SSCC-18 generator state
const ssccDialog = ref(false);
const ssccCount = ref(1);
const ssccDocumentRef = ref("");
const ssccShipToType = ref<"customer" | "company">("customer");
const ssccGeneratedItems = ref<Array<{ sscc18: string; human_readable: string; serial_ref: number }>>([]);
const ssccGenerator = useSsccGenerator();
const ssccCompanyPrefix = ssccGenerator.companyPrefix;
const ssccExtensionDigit = ssccGenerator.extensionDigit;
const ssccGenerating = ssccGenerator.generating;

const generateSscc = async () => {
	const count = Math.max(1, Math.min(100, Math.round(ssccCount.value) || 1));
	try {
		const items = await ssccGenerator.generateBatch(count);
		ssccGeneratedItems.value = items;
	} catch {
		useToastStore().show({ title: __("Failed to generate SSCC-18 serials"), color: "error" });
	}
};

const addSsccToQueue = () => {
	for (const gen of ssccGeneratedItems.value) {
		addOrMergePrintableItem(
			{
				item_code: gen.sscc18,
				item_name: `SSCC-18 ${gen.human_readable}`,
				barcode: gen.sscc18,
				qty: 1,
				uom: "",
				_prices_by_uom: {},
				item_barcode: [{ barcode: gen.sscc18, barcode_type: "SSCC-18" }],
				item_uoms: [],
				_symbology: "CODE128",
			},
			1,
			"sscc",
		);
	}
	useToastStore().show({
		title: __("{0} SSCC-18 label(s) added to queue", [String(ssccGeneratedItems.value.length)]),
		color: "success",
	});
	ssccDialog.value = false;
	ssccGeneratedItems.value = [];
};

const onAddItems = async (selectedItems) => {
	for (const item of selectedItems) {
		await onAddItem(item);
	}
};

const processBulkImport = async () => {
	bulkImportError.value = "";
	bulkImportSuccess.value = "";
	const raw = (bulkImportRaw.value || "").trim();
	if (!raw) {
		bulkImportError.value = __("Please enter data to import");
		return;
	}

	bulkImporting.value = true;
	try {
		let entries: Array<{ item_code: string; qty: number }> = [];

		if (bulkImportFormat.value === "csv") {
			const lines = raw.split("\n").filter((l) => l.trim());
			for (const line of lines) {
				const parts = line.split(",").map((p) => p.trim());
				if (parts[0]) {
					entries.push({
						item_code: parts[0],
						qty: parts[1] ? parseInt(parts[1], 10) || 1 : 1,
					});
				}
			}
		} else {
			const parsed = JSON.parse(raw);
			if (!Array.isArray(parsed)) throw new Error("JSON must be an array");
			entries = parsed.map((e) => ({
				item_code: String(e.item_code || e.item || "").trim(),
				qty: parseInt(e.qty || e.quantity || "1", 10) || 1,
			})).filter((e) => e.item_code);
		}

		if (!entries.length) {
			bulkImportError.value = __("No valid entries found");
			return;
		}

		const knownItems = itemsStore.items || [];
		let added = 0;
		for (const entry of entries) {
			const found = knownItems.find(
				(i) =>
					i.item_code === entry.item_code ||
					i.name === entry.item_code ||
					i.barcode === entry.item_code,
			);
			if (found) {
				added++;
				const qty = entry.qty || 1;
				addOrMergePrintableItem(
					{
						...found,
						barcode:
							found.barcode ||
							(Array.isArray(found.item_barcode) && found.item_barcode[0]?.barcode) ||
							"",
						uom: found.uom || found.stock_uom || "",
						qty,
						_prices_by_uom: found._prices_by_uom || {},
						item_barcode: found.item_barcode || [],
						item_uoms: found.item_uoms || [],
					},
					qty,
					"bulk-import",
				);
			} else {
				try {
					const res = await frappe.call({
						method: "posawesome.posawesome.api.items.get_items_details",
						args: {
							items_data: JSON.stringify([{ item_code: entry.item_code }]),
							pos_profile: JSON.stringify(uiStore.posProfile || {}),
							price_list: (uiStore.posProfile)?.selling_price_list || "",
						},
						silent: true,
					});
					const details = res.message && res.message[0];
					if (details) {
						added++;
						const qty = entry.qty || 1;
						addOrMergePrintableItem(
							{
								...details,
								barcode:
									details.barcode ||
									(Array.isArray(details.item_barcode) && details.item_barcode[0]?.barcode) ||
									"",
								uom: details.uom || details.stock_uom || "",
								qty,
								_prices_by_uom: details._prices_by_uom || {},
								item_barcode: details.item_barcode || [],
								item_uoms: details.item_uoms || [],
							},
							qty,
							"bulk-import",
						);
					} else {
						console.warn("Item not found:", entry.item_code);
					}
				} catch (e) {
					console.warn("Failed to fetch item:", entry.item_code, e);
				}
			}
		}

		bulkImportSuccess.value = __("Imported {0} items", String(added));
		bulkImportRaw.value = "";
	} catch (e) {
		bulkImportError.value = String((e as Error)?.message || e);
	} finally {
		bulkImporting.value = false;
	}
};

const onPrinterProfileChange = (profile: any) => {
	const p = profile && typeof profile === "object" ? profile : null;
	applyPrinterProfile(p);
};

const onImportFromSource = async (importedItems: any[]) => {
	let itemsToAdd = importedItems;
	if (serializationEnabled.value) {
		itemsToAdd = await serializationEngine.applySerialization(importedItems);
	}
	if (rfidEnabled.value && serializationEnabled.value) {
		itemsToAdd = itemsToAdd.map((item: any) => {
			const serial = item._generated_serials?.[0] || item.serial_no;
			if (serial) {
				const epcData = getEpcData({ ...item, serial_no: serial }, { enabled: true, epcPrefix: rfidEpcPrefix.value });
				return { ...item, _epc_data: epcData };
			}
			return item;
		});
	}
	importItems(itemsToAdd);
	useToastStore().show({
		title: __("Imported {0} items", [itemsToAdd.length]),
		color: "success",
	});
};

const thermalPrint = async () => {
	thermalPrinting.value = true;
	try {
		if (outputFormat.value === "zpl" || outputFormat.value === "epl") {
			await printLabelsRawWithFailover(items.value);
		} else {
			await printLabelsThermalWithFailover(items.value);
		}
	} finally {
		thermalPrinting.value = false;
	}
};

const onDesignerObjectChange = (id: string, updates: any) => {
	designer.updateObject(id, updates);
};

const onUploadImage = () => {
	const input = document.createElement("input");
	input.type = "file";
	input.accept = "image/*";
	input.onchange = (e: any) => {
		const file = e.target?.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (ev: any) => {
			const dataUrl = ev.target?.result;
			if (typeof dataUrl === "string") {
				const cx = designer.selectedObject.value
					? designer.selectedObject.value.x + 5
					: designer.labelSize.value.widthMm / 2 - 15;
				const cy = designer.selectedObject.value
					? designer.selectedObject.value.y + 5
					: designer.labelSize.value.heightMm / 2 - 7.5;
				designer.addImage(cx, cy, dataUrl, file.name);
				useToastStore().show({ title: __("Image added to canvas"), color: "success" });
			}
		};
		reader.readAsDataURL(file);
	};
	input.click();
};

const exportDesignerLayout = () => {
	const json = designer.exportLayout();
	const blob = new Blob([json], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `label-layout-${pageFormat.value}.json`;
	a.click();
	URL.revokeObjectURL(url);
	useToastStore().show({ title: __("Layout exported"), color: "success" });
};

const importDesignerLayout = () => {
	const input = document.createElement("input");
	input.type = "file";
	input.accept = ".json";
	input.onchange = (e: any) => {
		const file = e.target?.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			try {
				designer.importLayout(String(reader.result));
				useToastStore().show({ title: __("Layout imported"), color: "success" });
			} catch (err) {
				useToastStore().show({ title: __("Invalid layout file"), color: "error" });
			}
		};
		reader.readAsText(file);
	};
	input.click();
};

const applyDesignerTemplate = () => {
	const json = designer.exportLayout();
	try { JSON.parse(json); } catch {
		useToastStore().show({ title: __("Invalid layout — cannot apply"), color: "error" });
		return;
	}
	setDesignerTemplate(json);
	useToastStore().show({ title: __("Designer template applied"), color: "success" });
	viewMode.value = "labels";
};

const saveTemplateDialog = ref(false);
const saveTemplateTitle = ref("");
const saveTemplateDescription = ref("");
const saveTemplateLoading = ref(false);

const onSaveTemplate = async () => {
	const title = saveTemplateTitle.value.trim();
	if (!title) {
		useToastStore().show({ title: __("Template title is required"), color: "error" });
		return;
	}
	const layoutJson = designer.exportLayout();
	try { JSON.parse(layoutJson); } catch {
		useToastStore().show({ title: __("Invalid layout — cannot save"), color: "error" });
		return;
	}
	saveTemplateLoading.value = true;
	try {
		await frappe.call({
			method: "posawesome.posawesome.api.label_templates.save_label_template",
			args: {
				title,
				label_size: pageFormat.value,
				layout_json: layoutJson,
				description: saveTemplateDescription.value.trim(),
			},
			silent: true,
		});
		useToastStore().show({ title: __("Template saved: {0}", [title]), color: "success" });
		saveTemplateDialog.value = false;
		saveTemplateTitle.value = "";
		saveTemplateDescription.value = "";
	} catch (e: any) {
		useToastStore().show({ title: __("Failed to save template"), color: "error" });
	} finally {
		saveTemplateLoading.value = false;
	}
};

const templateLibraryDialog = ref(false);
const verificationDialog = ref(false);

const loadTemplateFromLibrary = (tpl: any) => {
	if (tpl.layout_json) {
		try {
			designer.importLayout(tpl.layout_json);
			pageFormat.value = tpl.label_size;
			syncDesignerLabelSize();
		} catch (err) {
			useToastStore().show({ title: __("Failed to load template layout"), color: "error" });
		}
	}
};

const syncDesignerLabelSize = () => {
	const preset = PAGE_FORMAT_PRESETS.find((p) => p.value === pageFormat.value);
	if (preset && preset.widthMm && preset.heightMm) {
		const w = parseFloat(String(preset.widthMm));
		const h = parseFloat(String(preset.heightMm));
		if (w > 0 && h > 0) designer.setLabelSize(w, h);
	}
};

watch(viewMode, (mode) => {
	if (mode === "designer") {
		syncDesignerLabelSize();
	}
});

watch(pageFormat, () => {
	if (viewMode.value === "designer") {
		syncDesignerLabelSize();
	}
});

const sizeWarnings = computed(() => getLabelSizeWarnings());

const previewDialog = ref(false);
const previewContent = ref("");

const generateLabelsHtml = (items) => {
	const printable = getPrintableItems(items, { notify: false });
	if (!printable.length) return "";
	const style = printOutput.getPrintStyles();
	const content = printOutput.generatePrintContent(printable);
	return `<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<style>${style}</style>
</head>
<body>
	${content}
	<script src="/assets/posawesome/dist/js/libs/JsBarcode.all.min.js"><\/script>
	<script>
		JsBarcode(".barcode").init();
	<\/script>
</body>
</html>`;
};

const openPreview = () => {
	const html = generateLabelsHtml(items.value);
	if (!html) {
		useToastStore().show({ title: __("No items with barcodes to preview"), color: "warning" });
		return;
	}
	previewContent.value = html;
	previewDialog.value = true;
};

const printFromPreview = () => {
	if (previewContent.value) {
		printLabels(items.value);
		previewDialog.value = false;
	}
};

const pdfFromPreview = () => {
	if (previewContent.value) {
		downloadPdf(items.value);
		previewDialog.value = false;
	}
};

const onExportPng = () => {
	const printable = getPrintableItems(items.value, { notify: false });
	if (!printable.length) return;
	const style = printOutput.getPrintStyles();
	const content = printOutput.generatePrintContent(printable);
	exportPng(content, style);
};

const onExportSvg = () => {
	const printable = getPrintableItems(items.value, { notify: false });
	if (!printable.length) return;
	const style = printOutput.getPrintStyles();
	const content = printOutput.generatePrintContent(printable);
	exportSvg(content, style);
};

const onExportCsv = () => {
	const printable = getPrintableItems(items.value, { notify: false });
	if (!printable.length) return;
	exportCsv(printable);
};

const { shouldShowScaleGramsInput } = scaleSettings;

const headers = computed(() => [
	{ title: __("Item Code"), key: "item_code", width: "13%" },
	{ title: __("Item Name"), key: "item_name", width: "17%" },
	{ title: __("UOM"), key: "uom", width: "10%" },
	{ title: __("Price"), key: "price", width: "10%" },
	{ title: __("Barcode"), key: "barcode", width: "20%" },
	{ title: __("Weight (g)"), key: "grams", width: "10%" },
	{ title: __("Location"), key: "warehouseLocation", width: "10%" },
	{ title: __("Quantity"), key: "qty", align: "center" as const, width: "10%" },
	{ title: "", key: "variableData", align: "center" as const, sortable: false, width: "5%" },
	{ title: "", key: "actions", align: "center" as const, sortable: false, width: "5%" },
]);

watch(
	() => uiStore.posProfile,
	(profile) => {
		if (profile) {
			// POS profile is available for printOutput formatCurrency
		}
	},
	{ deep: true, immediate: true },
);

onMounted(() => {
	scaleSettings.ensureScaleBarcodeSettings();
	fetchPrinterProfiles();
});

onUnmounted(() => {
	cleanupQueue();
});
</script>

<style scoped>
.qty-control-btn {
	width: 24px !important;
	height: 24px !important;
	min-width: 24px !important;
	border-radius: 6px !important;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
	box-shadow:
		0 2px 8px var(--pos-shadow-light),
		0 1px 3px var(--pos-shadow-light) !important;
	font-weight: 600 !important;
	backdrop-filter: blur(10px) !important;
	position: relative !important;
	overflow: hidden !important;
	flex-shrink: 0;
}

.qty-control-btn::before {
	content: "";
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: var(--pos-hover-bg);
	transition: transform 0.3s ease;
	transform: translateX(-100%);
	z-index: 0;
}

.qty-control-btn:hover::before {
	transform: translateX(0);
}

.qty-control-btn .v-icon {
	position: relative;
	z-index: 1;
}

.pos-table__qty-counter {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 2px;
	padding: 2px;
	min-width: 60px;
	max-width: 100px;
	width: auto;
	height: auto;
	background: var(--pos-surface-variant);
	border-radius: 8px;
	backdrop-filter: blur(10px);
	border: 1px solid var(--pos-border-light);
	transition: all 0.3s ease;
	margin: 0 auto;
	flex-shrink: 0;
	box-sizing: border-box;
}

.pos-table__qty-counter:hover {
	background: var(--pos-hover-bg);
	box-shadow: 0 4px 16px var(--pos-shadow);
	transform: translateY(-1px);
}

.pos-table__qty-display {
	min-width: 15px;
	max-width: 40px;
	width: auto;
	flex: 1 1 auto;
	text-align: center;
	font-weight: 600;
	padding: 0 2px;
	border-radius: 4px;
	background: var(--pos-primary-container);
	border: 1px solid var(--pos-primary-variant);
	font-family:
		"SF Pro Display", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "Noto Sans Arabic", "Tahoma",
		sans-serif;
	font-variant-numeric: lining-nums tabular-nums;
	font-feature-settings:
		"tnum" 1,
		"lnum" 1,
		"kern" 1;
	color: var(--pos-primary);
	font-size: 0.75rem;
	transition: all 0.2s ease;
	box-shadow: 0 1px 3px var(--pos-shadow-light);
	display: flex;
	align-items: center;
	justify-content: center;
	height: 24px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	letter-spacing: -0.02em;
	word-spacing: -0.1em;
	cursor: pointer;
}

.pos-table__qty-display:focus-visible {
	outline: 2px solid var(--pos-primary);
	outline-offset: 2px;
	z-index: 10;
}

.qty-control-btn:hover {
	transform: translateY(-1px);
	box-shadow: 0 2px 6px var(--pos-shadow) !important;
}

.qty-control-btn.minus-btn {
	background: var(--pos-button-warning-bg) !important;
	color: var(--pos-button-warning-text) !important;
	border: 2px solid var(--pos-button-warning-border) !important;
}

.qty-control-btn.minus-btn:hover {
	background: var(--pos-button-warning-hover-bg) !important;
	color: var(--pos-button-warning-hover-text) !important;
	box-shadow:
		0 6px 20px var(--pos-shadow),
		0 4px 8px var(--pos-shadow-light) !important;
	transform: translateY(-2px) scale(1.05) !important;
}

.qty-control-btn.plus-btn {
	background: var(--pos-button-success-bg) !important;
	color: var(--pos-button-success-text) !important;
	border: 2px solid var(--pos-button-success-border) !important;
}

.qty-control-btn.plus-btn:hover {
	background: var(--pos-button-success-hover-bg) !important;
	color: var(--pos-button-success-hover-text) !important;
	box-shadow:
		0 6px 20px var(--pos-shadow),
		0 4px 8px var(--pos-shadow-light) !important;
	transform: translateY(-2px) scale(1.05) !important;
}

.barcode-page {
	display: flex;
	flex-direction: column;
	height: 100%;
	width: 100%;
	overflow: hidden;
}

.barcode-header {
	flex: 0 0 auto;
}

.barcode-labels-workspace,
.barcode-designer-workspace {
	display: grid;
	flex: 1 1 auto;
	min-height: 0;
	min-width: 0;
	overflow: hidden;
}

.barcode-labels-workspace {
	display: block;
	width: 100%;
	height: 100%;
}

.barcode-items-pane {
	display: none;
}

.barcode-labels-pane {
	height: 100%;
	width: 100%;
	min-width: 0;
	min-height: 0;
	padding: 14px;
	overflow: hidden;
}

.barcode-labels-content {
	display: grid;
	grid-template-columns: minmax(0, 1fr) minmax(330px, 380px);
	gap: 14px;
	width: 100%;
	height: 100%;
	min-width: 0;
	min-height: 0;
	overflow: hidden;
}

.barcode-queue-column {
	display: grid;
	grid-template-rows: auto minmax(0, 1fr);
	min-width: 0;
	min-height: 0;
	overflow: hidden;
}

.barcode-queue-header {
	min-height: 42px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding-inline: 4px;
	padding-block: 6px;
	flex-shrink: 0;
}

.barcode-items-queue-list {
	min-height: 0;
	overflow-y: auto;
	overflow-x: hidden;
	padding: 2px 4px 16px 0;
}

.barcode-queue-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 48px 24px;
	text-align: center;
	border: 2px dashed var(--pos-border-light, #e0e0e0);
	border-radius: 12px;
	color: var(--pos-text-muted, #9e9e9e);
}

.barcode-settings-column {
	display: grid;
	grid-template-rows: minmax(0, 1fr) auto;
	min-width: 0;
	min-height: 0;
	overflow: hidden;
}

.barcode-settings-scroll {
	min-height: 0;
	overflow-y: auto;
	padding-inline-end: 3px;
}

.barcode-settings-card {
	padding: 12px !important;
	margin-bottom: 10px !important;
}

.barcode-settings-label {
	display: block;
	margin-bottom: 3px;
	font-size: 11px;
	font-weight: 600;
	color: rgba(var(--v-theme-on-surface), 0.6);
	text-transform: uppercase;
	letter-spacing: 0.4px;
}

.barcode-print-setup-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 8px;
}

.print-field--full {
	grid-column: 1 / -1;
}

.barcode-content-options-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	column-gap: 10px;
	row-gap: 0;
}

.barcode-output-actions {
	padding: 10px 0 0;
	border-top: 1px solid var(--pos-border-light, #e0e0e0);
	background: var(--pos-surface, #fff);
	flex-shrink: 0;
}

.barcode-item-actions-footer {
	display: flex;
	justify-content: flex-end;
	padding-top: 6px;
	margin-top: 4px;
	border-top: 1px solid var(--pos-border-light, #e0e0e0);
	grid-column: 1 / -1;
	width: 100%;
}

/* --- Designer Workspace Layout --- */
.barcode-designer-workspace {
	flex: 1 1 auto;
	display: grid;
	grid-template-columns: minmax(0, 1fr) 300px;
	grid-template-rows: minmax(0, 1fr) auto;
	min-width: 0;
	min-height: 0;
	overflow: hidden;
	background: var(--pos-background, #f6f7f9);
}

.barcode-designer-main {
	grid-column: 1;
	grid-row: 1;
	min-width: 0;
	min-height: 0;
	overflow: hidden;
	border-inline-end: 1px solid var(--pos-border-light, #e0e0e0);
}

.barcode-designer-properties {
	grid-column: 2;
	grid-row: 1;
	width: 300px;
	min-width: 0;
	min-height: 0;
	overflow-y: auto;
	background: var(--pos-surface, #fff);
}

.barcode-designer-footer {
	grid-column: 1 / -1;
	grid-row: 2;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	flexible-wrap: nowrap;
	min-height: 58px;
	padding: 8px 12px;
	border-top: 1px solid var(--pos-border-light, #e0e0e0);
	background: var(--pos-surface, #fff);
}

.barcode-designer-footer__left,
.barcode-designer-footer__right {
	display: flex;
	align-items: center;
	gap: 8px;
	flex-wrap: wrap;
}

@media (max-width: 959px) {
	.barcode-labels-workspace {
		display: flex;
		flex-direction: column;
		overflow-y: auto;
	}

	.barcode-items-pane {
		height: 380px;
		min-height: 380px;
		border-inline-end: none;
		border-bottom: 1px solid var(--pos-border-light, #e0e0e0);
	}

	.barcode-designer-workspace {
		grid-template-columns: minmax(0, 1fr);
	}

	.barcode-designer-properties {
		width: 100%;
		grid-column: 1;
		grid-row: 2;
		max-height: 300px;
	}

	.barcode-designer-footer {
		grid-row: 3;
		flex-wrap: wrap;
	}
}

.pos-table__qty-input {
	max-width: 80px;
	margin: 0 auto;
}
.pos-table__qty-input :deep(input) {
	text-align: center;
	font-weight: 600;
	-moz-appearance: textfield;
	appearance: textfield;
}
.pos-table__qty-input :deep(input::-webkit-outer-spin-button),
.pos-table__qty-input :deep(input::-webkit-inner-spin-button) {
	-webkit-appearance: none;
	appearance: none;
	margin: 0;
}
.pos-table__qty-input :deep(.v-input__control) {
	height: 24px;
}
.pos-table__qty-input :deep(.v-field__field) {
	height: 24px;
	padding: 0 4px;
}
.pos-table__qty-input :deep(.v-field__input) {
	padding: 0;
	min-height: 24px;
	font-size: 0.75rem;
}
</style>
