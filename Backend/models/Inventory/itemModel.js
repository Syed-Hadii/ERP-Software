const mongoose = require('mongoose');
const { Schema } = mongoose;


const options = { discriminatorKey: 'category', collection: 'items', timestamps: true };
const BaseItemSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  lowStockThreshold: {
    type: Number,
    min: 0,
    default: 0
  },
  unit: {
    type: String,
    required: true,
  },
  description: { type: String },
  expenseAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChartAccount',
  },
  managerInventoryAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChartAccount',
  },
  cropInventoryAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChartAccount',
  },
  cattleInventoryAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChartAccount',
  },
}, options);

const Item = mongoose.model('Item', BaseItemSchema);

// Fertilizer-specific schema
const FertilizerSchema = new Schema({
  companyName: { type: String, required: true },
  nutrientComposition: { type: String, required: true },
  form: { type: String, enum: ['granular', 'liquid', 'powder'], required: true },
  applicationRate: { type: String },
}, { _id: false });
Item.discriminator('fertilizer', FertilizerSchema);

// Pesticide-specific schema
const PesticideSchema = new Schema({
  companyName: { type: String, required: true },
  activeIngredient: { type: String, required: true },
  formulation: { type: String, enum: ['EC', 'WP', 'SL', 'SC'], required: true },
  safetyInterval: { type: String },
}, { _id: false });
Item.discriminator('pesticide', PesticideSchema);

// Seed-specific schema
const SeedSchema = new Schema({
  companyName: { type: String, required: true },
  productionYear: { type: Number },
  batchNumber: { type: String },
  variety: { type: String, required: true },
  germinationRate: { type: Number },
  lotNumber: { type: String },
  seedTreatment: { type: String },
}, { _id: false });
Item.discriminator('seed', SeedSchema);

// Equipment-specific schema
const EquipmentSchema = new Schema({
  manufacturer: { type: String, required: true },
  model: { type: String, required: true },
  variant: { type: String },
  serialNumber: { type: String, unique: true },
  purchaseDate: { type: Date },
  warrantyPeriod: { type: String },
  maintenanceSchedule: { type: String },
}, { _id: false });
Item.discriminator('equipment', EquipmentSchema);

// Medicine-specific schema
const MedicineSchema = new Schema({
  companyName: { type: String, required: true },
  batchNumber: { type: String },
  expiryDate: { type: Date },
  dosageForm: { type: String, enum: ['tablet', 'syrup', 'injectable'], required: true },
  activeCompound: { type: String, required: true },
  withdrawalPeriod: { type: String },
}, { _id: false });
Item.discriminator('medicine', MedicineSchema);

// Cattle Feed-specific schema
const CattleFeedSchema = new Schema({
  type: { type: String, required: true },
  origin: { type: String },
}, { _id: false });
Item.discriminator('cattle_feed', CattleFeedSchema);

// Tools-specific schema
const ToolsSchema = new Schema({
  manufacturer: { type: String, required: true },
  type: { type: String, enum: ['hand_tool', 'power_tool', 'farm_implement'], required: true },
  condition: { type: String, enum: ['new', 'used', 'refurbished'] },
  purchaseDate: { type: Date },
}, { _id: false });
Item.discriminator('tools', ToolsSchema);

// Packaging-specific schema
const PackagingSchema = new Schema({
  material: { type: String, enum: ['plastic', 'paper', 'cardboard', 'biodegradable'], required: true },
  capacity: { type: String, required: true }, // e.g., "5L", "1kg"
  supplier: { type: String },
}, { _id: false });
Item.discriminator('packaging', PackagingSchema);

// Fuel & Lubricants-specific schema
const FuelLubricantsSchema = new Schema({
  type: { type: String, enum: ['diesel', 'petrol', 'lubricant', 'hydraulic_fluid'], required: true },
  grade: { type: String },
  volume: { type: String }, // e.g., "20L", "200L"
}, { _id: false });
Item.discriminator('fuel_lubricants', FuelLubricantsSchema);

// Irrigation Supplies-specific schema
const IrrigationSuppliesSchema = new Schema({
  type: { type: String, enum: ['pipe', 'valve', 'sprinkler', 'drip_emitter'], required: true },
  material: { type: String, enum: ['PVC', 'metal', 'plastic'], required: true },
  size: { type: String }, // e.g., "2 inch", "50mm"
}, { _id: false });
Item.discriminator('irrigation_supplies', IrrigationSuppliesSchema);

module.exports = Item;