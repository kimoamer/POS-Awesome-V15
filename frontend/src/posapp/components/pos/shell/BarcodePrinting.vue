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
			<!-- Left Items Selector Pane -->
			<aside class="barcode-items-pane">
				<ItemsSelector
					context="barcode"
					:show-only-barcode-items="true"
					class="h-100"
					@add-item="onAddItem"
					@add-items="onAddItems"
				/>
			</aside>

			<!-- Right Pane: Queue Cards & Settings -->
			<main class="barcode-labels-pane pa-4 overflow-y-auto">
				<v-row dense class="ma-0 ga-4 align-start">
					<!-- Queue Column (Left) -->
					<v-col cols="12" lg="7" class="pa-0">
						<div class="d-flex align-center justify-space-between mb-3">
							<h3 class="text-subtitle-1 font-weight-bold text-primary mb-0 d-flex align-center ga-2">
								<v-icon size="20">mdi-tray-full</v-icon>
								{{ __("LABELS QUEUE") }} (<bdi>{{ items.length }}</bdi>)
							</h3>
							<span class="text-caption text-medium-emphasis">
								{{ __("Total Labels") }}: <strong class="text-primary">{{ totalLabelsCount }}</strong>
							</span>
						</div>

						<!-- Compact Cards Rows -->
						<div v-if="items.length" class="barcode-items-queue-list">
							<v-card
								v-for="item in items"
								:key="item.item_code + '_' + (item.uom || '')"
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

									<div class="flex-grow-1" style="min-width: 130px;">
										<label class="text-caption text-medium-emphasis d-block mb-1">{{ __("Location") }}</label>
										<v-text-field
											v-model="item.warehouseLocation"
											density="compact"
											variant="outlined"
											hide-details
											class="pos-themed-input"
											:placeholder="__('Location')"
										></v-text-field>
									</div>
								</div>
							</v-card>
						</div>

						<div v-else class="text-center py-8 border-2 border-dashed rounded-lg pa-6 text-medium-emphasis">
							<v-icon size="48" color="medium-emphasis" class="mb-2">mdi-barcode-off</v-icon>
							<div class="font-weight-bold text-subtitle-1">{{ __("No barcode items added yet") }}</div>
							<div class="text-caption text-disabled max-w-sm mx-auto">
								{{ __("Select items from the catalog on the left to add labels to the print queue.") }}
							</div>
						</div>
					</v-col>

					<!-- Controls Column (Right) -->
					<v-col cols="12" lg="5" class="pa-0">
						<!-- PRINT SETUP CARD -->
						<v-card class="mb-4 pa-4 border rounded-lg pos-themed-card" flat>
							<h4 class="text-subtitle-2 font-weight-bold text-primary mb-3 d-flex align-center ga-2">
								<v-icon size="18">mdi-printer-settings</v-icon>
								{{ __("PRINT SETUP") }}
							</h4>

							<div class="d-flex flex-column ga-3">
								<div>
									<label class="text-caption font-weight-bold text-medium-emphasis d-block mb-1">{{ __("Page Format") }}</label>
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

								<div v-if="pageFormat === 'A4'" class="d-flex ga-2">
									<div class="flex-grow-1">
										<label class="text-caption font-weight-bold text-medium-emphasis d-block mb-1">{{ __("Columns") }}</label>
										<v-text-field
											v-model.number="gridCols"
											type="number"
											density="compact"
											variant="outlined"
											hide-details
											class="pos-themed-input"
											min="1"
										></v-text-field>
									</div>
									<div class="flex-grow-1">
										<label class="text-caption font-weight-bold text-medium-emphasis d-block mb-1">{{ __("Rows") }}</label>
										<v-text-field
											v-model.number="gridRows"
											type="number"
											density="compact"
											variant="outlined"
											hide-details
											class="pos-themed-input"
											min="1"
										></v-text-field>
									</div>
								</div>

								<div class="d-flex ga-2">
									<div class="flex-grow-1">
										<label class="text-caption font-weight-bold text-medium-emphasis d-block mb-1">{{ __("Symbology") }}</label>
										<v-select
											v-model="symbology"
											:items="symbologyOptions"
											density="compact"
											variant="outlined"
											hide-details
											class="pos-themed-input"
										></v-select>
									</div>
									<div style="width: 100px;">
										<label class="text-caption font-weight-bold text-medium-emphasis d-block mb-1">{{ __("Output") }}</label>
										<v-select
											v-model="outputFormat"
											:items="['html', 'zpl', 'epl']"
											density="compact"
											variant="outlined"
											hide-details
											class="pos-themed-input"
										></v-select>
									</div>
								</div>

								<div>
									<label class="text-caption font-weight-bold text-medium-emphasis d-block mb-1">{{ __("Printer Profile") }}</label>
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

								<div>
									<label class="text-caption font-weight-bold text-medium-emphasis d-block mb-1">{{ __("DPI Resolution") }}</label>
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

						<!-- CONTENT OPTIONS CARD -->
						<v-card class="mb-4 pa-4 border rounded-lg pos-themed-card" flat>
							<h4 class="text-subtitle-2 font-weight-bold text-primary mb-3 d-flex align-center ga-2">
								<v-icon size="18">mdi-checkbox-multiple-marked-outline</v-icon>
								{{ __("CONTENT OPTIONS") }}
							</h4>

							<div class="d-flex flex-column ga-1">
								<v-checkbox v-model="includePrice" :label="__('Include Price')" density="compact" hide-details color="primary"></v-checkbox>
								<v-checkbox v-model="serializationEnabled" :label="__('Serialization')" density="compact" hide-details color="primary"></v-checkbox>
								<v-checkbox v-model="includeBatchSerial" :label="__('Include Batch / Serial')" density="compact" hide-details color="primary"></v-checkbox>
								<v-checkbox v-model="includeWarehouseLocation" :label="__('Include Warehouse Location')" density="compact" hide-details color="primary"></v-checkbox>
								<v-checkbox v-model="rfidEnabled" :label="__('RFID Encode (ZPL)')" density="compact" hide-details color="primary" :disabled="outputFormat !== 'zpl'"></v-checkbox>
								<v-text-field
									v-if="rfidEnabled"
									v-model="rfidEpcPrefix"
									:label="__('EPC Prefix (Hex)')"
									density="compact"
									variant="outlined"
									hide-details
									class="pos-themed-input mt-2"
									placeholder="303402B4DD"
								></v-text-field>
							</div>
						</v-card>

						<!-- Warnings -->
						<v-alert v-if="sizeWarnings.length" type="warning" density="compact" variant="tonal" class="mb-4">
							{{ sizeWarnings[0] }}
						</v-alert>
					</v-col>
				</v-row>
			</main>
		</div>

		<!-- Save Template Dialog -->
		<v-dialog v-model="saveTemplateDialog" max-width="450">
			<v-card>
				<v-card-title class="bg-primary text-white">{{ __("Save Label Template") }}</v-card-title>
				<v-card-text class="pt-4">
					<v-text-field v-model="saveTemplateTitle" :label="__('Template Title')" variant="outlined" density="compact" class="mb-3" autofocus></v-text-field>
					<v-textarea v-model="saveTemplateDescription" :label="__('Description (optional)')" variant="outlined" density="compact" rows="2" class="mb-3"></v-textarea>
				</v-card-text>
				<v-card-actions class="justify-end pa-4 pt-0">
					<v-btn variant="text" @click="saveTemplateDialog = false">{{ __("Cancel") }}</v-btn>
					<v-btn color="primary" variant="elevated" :loading="saveTemplateLoading" @click="onSaveTemplate">{{ __("Save") }}</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<!-- Template Library Dialog -->
		<TemplateLibrary v-model="templateLibraryDialog" @load="loadTemplateFromLibrary" />

		<!-- Barcode Verification Dialog -->
		<VerificationDialog v-model="verificationDialog" />

		<!-- Add Item Quantity Dialog -->
		<v-dialog v-model="addItemDialog" max-width="400">
			<v-card v-if="pendingAddItem">
				<v-card-title class="bg-primary text-white">
					{{ __("Enter Quantity") }}
				</v-card-title>
				<v-card-text class="pt-4">
					<div class="text-subtitle-1 mb-2">{{ pendingAddItem.item_name }}</div>
					<div
						v-if="pendingAddItem && shouldShowScaleGramsInput(pendingAddItem)"
						class="text-caption text-medium-emphasis mb-2"
					>
						{{ __("Scale barcode detected. Quantity here is the number of labels to print.") }}
					</div>
					<v-select
						v-if="pendingAddItem && getItemUomOptions(pendingAddItem).length > 1"
						v-model="pendingAddItem.uom"
						:items="getItemUomOptions(pendingAddItem)"
						:label="__('UOM')"
						variant="outlined"
						density="compact"
						class="mb-2 pos-themed-input"
						@update:modelValue="onPendingUomChange"
					></v-select>
					<v-text-field
						v-model.number="addItemQty"
						:label="
							pendingAddItem && shouldShowScaleGramsInput(pendingAddItem)
								? __('Labels')
								: __('Quantity')
						"
						type="number"
						min="1"
						step="1"
						variant="outlined"
						autofocus
						@keydown.enter="confirmAddItem"
					></v-text-field>
					<v-text-field
						v-if="pendingAddItem && shouldShowScaleGramsInput(pendingAddItem)"
						v-model.number="pendingScaleGrams"
						:label="__('Weight (grams)')"
						type="number"
						min="1"
						step="1"
						variant="outlined"
						class="mt-2"
						@update:modelValue="onPendingScaleGramsInput"
						@blur="syncPendingScaleBarcode"
						@keydown.enter.prevent="syncPendingScaleBarcode"
					></v-text-field>
					<div
						v-if="
							pendingAddItem &&
							shouldShowScaleGramsInput(pendingAddItem) &&
							pendingAddItem.barcode
						"
						class="text-caption text-medium-emphasis mt-1"
					>
						{{ __("Generated scale barcode: {0}", [pendingAddItem.barcode]) }}
					</div>
				</v-card-text>
				<v-card-actions class="justify-end">
					<v-btn variant="text" @click="closeAddItemDialog">{{ __("Cancel") }}</v-btn>
					<v-btn color="primary" variant="elevated" @click="confirmAddItem">{{ __("Add") }}</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
		<!-- Variable Data Dialog -->
		<v-dialog v-model="variableDataDialog" max-width="400">
			<v-card v-if="variableDataItem">
				<v-card-title class="bg-primary text-white">
					{{ __("Variable Data") }}
				</v-card-title>
				<v-card-text class="pt-4">
					<v-autocomplete
						v-if="getAvailableBatches(variableDataItem).length"
						v-model="variableDataItem.batch_no"
						:items="getAvailableBatches(variableDataItem)"
						item-title="batch_no"
						item-value="batch_no"
						:label="__('Batch No')"
						variant="outlined"
						density="compact"
						class="mb-2"
						clearable
						@update:modelValue="onSelectBatch(variableDataItem, $event)"
					></v-autocomplete>
					<v-text-field
						v-else
						v-model="variableDataItem.batch_no"
						:label="__('Batch No')"
						variant="outlined"
						density="compact"
						class="mb-2"
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
						class="mb-2"
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
						class="mb-2"
					></v-text-field>
					<v-text-field
						v-model="variableDataItem.expiry_date"
						:label="__('Expiry Date')"
						:hint="__('Auto-filled when batch selected')"
						persistent-hint
						type="date"
						variant="outlined"
						density="compact"
						class="mb-2"
					></v-text-field>
					<v-autocomplete
						v-model="variableDataItem.warehouseLocation"
						:items="warehouseOptions"
						item-title="warehouse_name"
						item-value="name"
						:label="__('Location')"
						:loading="warehouseLoading"
						hint="__('Choose warehouse from ERPNext')"
						persistent-hint
						variant="outlined"
						density="compact"
						class="mb-2"
						clearable
					></v-autocomplete>
				</v-card-text>
				<v-card-actions class="justify-end">
					<v-btn variant="text" @click="closeVariableDataDialog">{{ __("Cancel") }}</v-btn>
					<v-btn color="primary" variant="elevated" @click="closeVariableDataDialog">{{ __("Save") }}</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
		<!-- Bulk Import Dialog -->
		<v-dialog v-model="bulkImportDialog" max-width="600">
			<v-card>
				<v-card-title class="bg-primary text-white d-flex align-center">
					<span>{{ __("Bulk Import") }}</span>
					<v-spacer></v-spacer>
					<v-btn icon="mdi-close" variant="text" color="white" @click="bulkImportDialog = false"></v-btn>
				</v-card-title>
				<v-card-text class="pt-4">
					<v-radio-group v-model="bulkImportFormat" inline hide-details density="compact" class="mb-2">
						<v-radio :label="__('CSV')" value="csv"></v-radio>
						<v-radio :label="__('JSON')" value="json"></v-radio>
					</v-radio-group>
					<v-textarea
						v-model="bulkImportRaw"
						:label="bulkImportFormat === 'csv' ? __('item_code, qty') : __('[{item_code:..., qty:...}]')"
						variant="outlined"
						rows="6"
						:hint="bulkImportFormat === 'csv' ? __('One per line: item_code, qty') : __('Array of objects with item_code, qty')"
						persistent-hint
					></v-textarea>
					<v-alert v-if="bulkImportError" type="error" density="compact" variant="tonal" class="mb-2">
						{{ bulkImportError }}
					</v-alert>
					<v-alert v-if="bulkImportSuccess" type="success" density="compact" variant="tonal" class="mb-2">
						{{ bulkImportSuccess }}
					</v-alert>
				</v-card-text>
				<v-card-actions class="justify-end">
					<v-btn variant="text" @click="bulkImportDialog = false">{{ __("Cancel") }}</v-btn>
					<v-btn color="primary" variant="elevated" :loading="bulkImporting" @click="processBulkImport">
						{{ __("Import") }}
					</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<ImportSourceDialog v-model="importDialog" @import="onImportFromSource" />

		<!-- SSCC-18 Shipping Label Generator Dialog -->
		<v-dialog v-model="ssccDialog" max-width="550">
			<v-card>
				<v-card-title class="bg-primary text-white d-flex align-center">
					<span class="text-h6">{{ __("Generate SSCC-18 Shipping Labels") }}</span>
					<v-spacer></v-spacer>
					<v-btn icon="mdi-close" variant="text" color="white" @click="ssccDialog = false"></v-btn>
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
				<v-card-actions class="justify-space-between pa-4 pt-0">
					<div>
						<v-btn v-if="ssccGeneratedItems.length" color="success" variant="elevated" prepend-icon="mdi-plus" @click="addSsccToQueue" class="mr-2">
							{{ __("Add {0} to Queue", [String(ssccGeneratedItems.length)]) }}
						</v-btn>
					</div>
					<div>
						<v-btn variant="text" @click="ssccDialog = false" class="mr-1">{{ __("Close") }}</v-btn>
						<v-btn color="primary" variant="elevated" :loading="ssccGenerating" @click="generateSscc">
							<v-icon start>mdi-barcode-scan</v-icon>
							{{ __("Generate") }}
						</v-btn>
					</div>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<!-- Label Preview Dialog -->
		<v-dialog v-model="previewDialog" fullscreen>
			<v-card v-if="previewContent" class="d-flex flex-column">
				<v-card-title class="bg-primary text-white d-flex align-center">
					<span class="text-h6">{{ __("Label Preview") }}</span>
					<v-spacer></v-spacer>
					<v-btn
						icon="mdi-close"
						variant="text"
						color="white"
						@click="previewDialog = false"
					></v-btn>
				</v-card-title>
				<v-card-text class="flex-grow-1 pa-0 d-flex flex-column">
					<iframe
						:srcdoc="previewContent"
						class="flex-grow-1"
						style="width: 100%; border: none;"
					></iframe>
				</v-card-text>
				<v-card-actions class="pa-4 justify-center">
					<v-btn
						color="primary"
						size="large"
						prepend-icon="mdi-printer"
						@click="printFromPreview"
					>
						{{ __("Print") }}
					</v-btn>
					<v-btn
						color="secondary"
						size="large"
						prepend-icon="mdi-file-pdf-box"
						@click="pdfFromPreview"
					>
						{{ __("Download PDF") }}
					</v-btn>
					<v-btn variant="text" size="large" @click="previewDialog = false">
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

.barcode-labels-workspace {
	display: grid;
	grid-template-columns: minmax(360px, 34%) minmax(0, 1fr);
	height: calc(100% - 53px);
	min-height: 0;
	overflow: hidden;
}

.barcode-items-pane {
	height: 100%;
	min-height: 0;
	overflow: hidden;
	border-inline-end: 1px solid var(--pos-border-light, #e0e0e0);
}

.barcode-labels-pane {
	height: 100%;
	min-height: 0;
	overflow-y: auto;
}

.barcode-designer-workspace {
	display: flex;
	flex-direction: column;
	height: calc(100% - 53px);
	min-height: 0;
	overflow: hidden;
}

.designer-root {
	display: grid;
	grid-template-columns: 80px minmax(0, 1fr) minmax(280px, 320px);
	height: calc(100% - 52px);
	min-height: 0;
	overflow: hidden;
}

.designer-toolbox {
	height: 100%;
	min-height: 0;
	overflow-y: auto;
}

.designer-scroll {
	height: 100%;
	min-height: 0;
	overflow: auto;
}

.designer-properties-pane {
	height: 100%;
	min-height: 0;
	overflow-y: auto;
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

	.designer-root {
		display: flex;
		flex-direction: column;
		overflow-y: auto;
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
