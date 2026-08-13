const mongooseLib = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../../../.env');
const envExamplePath = path.join(__dirname, '../../../.env.example');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else if (fs.existsSync(envExamplePath)) {
  dotenv.config({ path: envExamplePath });
} else {
  dotenv.config();
}

const User = require('../models/User');
const Address = require('../models/Address');
const Category = require('../models/Category');
const MaterialType = require('../models/MaterialType');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Delivery = require('../models/Delivery');
const Payout = require('../models/Payout.js');
const Dispute = require('../models/Dispute');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const Cart = require('../models/Cart');

const dbUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/managed-marketplace';

const seedData = async (isImported = false) => {
  try {
    if (mongooseLib.connection.readyState === 0) {
      console.log('Connecting to database...');
      await mongooseLib.connect(dbUri);
    }
    console.log('Database connected. Clearing existing collections...');

    // Clear all collections
    await User.deleteMany({});
    await Address.deleteMany({});
    await Category.deleteMany({});
    await MaterialType.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Payment.deleteMany({});
    await Delivery.deleteMany({});
    await Payout.deleteMany({});
    await Dispute.deleteMany({});
    await Review.deleteMany({});
    await Notification.deleteMany({});
    await AuditLog.deleteMany({});
    await Cart.deleteMany({});

    console.log('Database cleared. Seeding Categories...');

    const categoriesData = [
      { name: 'Electronics & Appliances', description: 'Usable electronic waste, scrap, and second-hand appliances' },
      { name: 'Furniture', description: 'Desks, chairs, tables, and cabinets made of wood, metal, or plastic' },
      { name: 'Clothing & Fashion', description: 'Usable second-hand clothes, textiles, and fabrics' },
      { name: 'Household Items', description: 'General household scrap, usable items, decorations' },
      { name: 'Kitchen Items', description: 'Pots, pans, containers, and kitchen utensils' },
      { name: 'Books & Education', description: 'Used textbooks, novels, paper scrap' },
      { name: 'Tools & Equipment', description: 'Construction and repair tools, motors, wires' },
      { name: 'Baby & Kids', description: 'Toys, cribs, clothing for children' },
      { name: 'Sports & Fitness', description: 'Bicycles, weights, outdoor usable gear' },
      { name: 'Other', description: 'Miscellaneous usable scrap materials' }
    ];
    const seededCategories = await Category.insertMany(categoriesData);
    console.log(`Seeded ${seededCategories.length} categories.`);

    console.log('Seeding Material Types...');
    const materialsData = [
      { name: 'Plastic', description: 'PET bottles, containers, structural plastic' },
      { name: 'Metal', description: 'Scrap iron, steel bars, copper wire, aluminum' },
      { name: 'Wood', description: 'Pallets, logs, lumber, broken furniture parts' },
      { name: 'Glass', description: 'Bottles, jars, glass sheet remnants' },
      { name: 'Fabric', description: 'Textiles, canvas, cotton scrap' },
      { name: 'Leather', description: 'Belts, bags, shoes, remnants' },
      { name: 'Paper', description: 'Cardboard, books, newspaper bales' },
      { name: 'Electronic', description: 'Circuits, components, scrap appliances' },
      { name: 'Mixed Material', description: 'Complex products with multiple materials combined' },
      { name: 'Other', description: 'Other unclassified materials' }
    ];
    const seededMaterials = await MaterialType.insertMany(materialsData);
    console.log(`Seeded ${seededMaterials.length} material types.`);

    console.log('Seeding Users...');
    
    // Seed Admin
    const adminUser = await User.create({
      name: 'Adama Admin',
      email: 'admin@marketplace.com',
      password: 'AdminPass123',
      role: 'ADMIN',
      isActive: true
    });

    // Seed Staff 1 (Finance)
    const staffFinance = await User.create({
      name: 'Selam Finance',
      email: 'staff.finance@marketplace.com',
      password: 'StaffPass123',
      role: 'STAFF',
      staffPermissions: ['VIEW_ORDERS', 'VERIFY_PAYMENTS', 'VIEW_SELLER_PAYOUTS', 'PROCESS_PAYOUTS'],
      isActive: true
    });

    // Seed Staff 2 (Logistics)
    const staffLogistics = await User.create({
      name: 'Bekele Logistics',
      email: 'staff.logistics@marketplace.com',
      password: 'StaffPass123',
      role: 'STAFF',
      staffPermissions: ['VIEW_ORDERS', 'MANAGE_DELIVERIES', 'SET_DELIVERY_FEES', 'UPDATE_ORDER_STATUS'],
      isActive: true
    });

    // Seed Sellers (Seller 1 is approved, Seller 2 is pending)
    const seller1 = await User.create({
      name: 'Abebe Seller One',
      email: 'seller1@marketplace.com',
      password: 'SellerPass123',
      role: 'SELLER',
      isSellerApproved: true,
      isActive: true
    });

    const seller2 = await User.create({
      name: 'Kebede Seller Two',
      email: 'seller2@marketplace.com',
      password: 'SellerPass123',
      role: 'SELLER',
      isSellerApproved: false, // Starts as pending admin approval
      isActive: true
    });

    // Seed Buyers
    const buyer1 = await User.create({
      name: 'Tariku Buyer One',
      email: 'buyer1@marketplace.com',
      password: 'BuyerPass123',
      role: 'BUYER',
      isActive: true
    });

    const buyer2 = await User.create({
      name: 'Chala Buyer Two',
      email: 'buyer2@marketplace.com',
      password: 'BuyerPass123',
      role: 'BUYER',
      isActive: true
    });

    console.log('Seeded Users. Seeding default addresses...');

    // Seed Address for Buyer 1
    const addr1 = await Address.create({
      user: buyer1._id,
      title: 'Home Address',
      streetAddress: 'Kebele 02, Block 12, House 405',
      subCity: 'Kebele 02',
      city: 'Adama',
      phoneNumber: '+251911223344',
      isDefault: true
    });

    const addr2 = await Address.create({
      user: seller1._id,
      title: 'Shop Depot',
      streetAddress: 'Bole Subcity, Industry Zone',
      subCity: 'Bole',
      city: 'Adama',
      phoneNumber: '+251922334455',
      isDefault: true
    });

    console.log('Seeded addresses. Seeding default Products...');

    const electronicsCat = seededCategories.find(c => c.name === 'Electronics & Appliances');
    const furnitureCat = seededCategories.find(c => c.name === 'Furniture');
    const toolsCat = seededCategories.find(c => c.name === 'Tools & Equipment');
    const booksCat = seededCategories.find(c => c.name === 'Books & Education');

    const plasticMat = seededMaterials.find(m => m.name === 'Plastic');
    const woodMat = seededMaterials.find(m => m.name === 'Wood');
    const metalMat = seededMaterials.find(m => m.name === 'Metal');
    const paperMat = seededMaterials.find(m => m.name === 'Paper');
    const electroMat = seededMaterials.find(m => m.name === 'Electronic');

    const productsData = [
      {
        name: 'Usable Pine Wood Pallets',
        description: 'Batch of 10 clean pine wood pallets. Great for building scrap wood furniture or storage shelving.',
        price: 450,
        quantity: 8,
        category: furnitureCat._id,
        materialType: woodMat._id,
        condition: 'Good',
        images: ['https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=500&auto=format&fit=crop&q=60'],
        seller: seller1._id,
        approvalStatus: 'APPROVED',
        location: { subCity: 'Bole', city: 'Adama' }
      },
      {
        name: 'Heavy Duty Metal Filing Cabinet',
        description: 'Solid steel 4-drawer filing cabinet in Excellent condition. Keys are included.',
        price: 2500,
        quantity: 2,
        category: furnitureCat._id,
        materialType: metalMat._id,
        condition: 'Like New',
        images: ['https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=500&auto=format&fit=crop&q=60'],
        seller: seller1._id,
        approvalStatus: 'APPROVED',
        location: { subCity: 'Kebele 04', city: 'Adama' }
      },
      {
        name: 'Clean Recycled PET Bottle Bales',
        description: 'Large bale of sorted and washed PET plastic bottles. Ready for processing or shredding.',
        price: 1500,
        quantity: 5,
        category: seededCategories.find(c => c.name === 'Other')._id,
        materialType: plasticMat._id,
        condition: 'Used',
        images: ['https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=500&auto=format&fit=crop&q=60'],
        seller: seller1._id,
        approvalStatus: 'APPROVED',
        location: { subCity: 'Industry Zone', city: 'Adama' }
      },
      {
        name: 'Second-hand Electric Drill (Bosch)',
        description: 'Authentic Bosch electric drill, corded. Missing bits, but the motor is running strong.',
        price: 1800,
        quantity: 1,
        category: toolsCat._id,
        materialType: electroMat._id,
        condition: 'Good',
        images: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&auto=format&fit=crop&q=60'],
        seller: seller1._id,
        approvalStatus: 'APPROVED',
        location: { subCity: 'Kebele 02', city: 'Adama' }
      },
      {
        name: 'Used High School Mathematics Textbooks',
        description: 'Bundle of Grade 11 and 12 Maths textbooks. Minor wear on covers, but complete pages inside.',
        price: 300,
        quantity: 15,
        category: booksCat._id,
        materialType: paperMat._id,
        condition: 'Fair',
        images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60'],
        seller: seller2._id, // By seller 2 (who is not approved)
        approvalStatus: 'PENDING_APPROVAL', // Needs approval
        location: { subCity: 'Kebele 08', city: 'Adama' }
      },
      {
        name: 'Scrap Copper Wires',
        description: 'Stripped high-purity copper wires. Weighs approximately 12kg in total.',
        price: 3200,
        quantity: 1,
        category: toolsCat._id,
        materialType: metalMat._id,
        condition: 'Used',
        images: ['https://images.unsplash.com/photo-1601524909162-be87252be298?w=500&auto=format&fit=crop&q=60'],
        seller: seller1._id,
        approvalStatus: 'DRAFT', // Draft state
        location: { subCity: 'Bole', city: 'Adama' }
      }
    ];

    await Product.insertMany(productsData);
    console.log('Seeded default products.');

    console.log('Database Seeding Complete! 🎉');
    console.log('Demo Credentials for local testing:');
    console.log('----------------------------------------------------');
    console.log('Role       | Email                        | Password');
    console.log('----------------------------------------------------');
    console.log('Admin      | admin@marketplace.com        | AdminPass123');
    console.log('Staff (Fin)| staff.finance@marketplace.com | StaffPass123');
    console.log('Staff (Log)| staff.logistics@marketplace.com| StaffPass123');
    console.log('Seller 1   | seller1@marketplace.com      | SellerPass123');
    console.log('Seller 2   | seller2@marketplace.com      | SellerPass123');
    console.log('Buyer 1    | buyer1@marketplace.com       | BuyerPass123');
    console.log('Buyer 2    | buyer2@marketplace.com       | BuyerPass123');
    console.log('----------------------------------------------------');

    if (!isImported) {
      process.exit(0);
    }
  } catch (error) {
    console.error('Seeding error:', error);
    if (!isImported) {
      process.exit(1);
    } else {
      throw error;
    }
  }
};

if (require.main === module) {
  seedData();
}

module.exports = seedData;
