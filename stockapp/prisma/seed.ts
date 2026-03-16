/**
 * prisma/seed.ts — Realistic retail sample data for StockSystem
 * Run: npx prisma db seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding StockSystem database...");

  // ── Users ──────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("admin123", 12);
  const managerPassword = await bcrypt.hash("manager123", 12);
  const employeePassword = await bcrypt.hash("employee123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@stocksystem.com" },
    update: {},
    create: {
      name: "Admin Principal",
      email: "admin@stocksystem.com",
      password: adminPassword,
      role: "ADMIN",
      lastLogin: new Date(),
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@stocksystem.com" },
    update: {},
    create: {
      name: "Laura García",
      email: "manager@stocksystem.com",
      password: managerPassword,
      role: "MANAGER",
      lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 3),
    },
  });

  const employee1 = await prisma.user.upsert({
    where: { email: "carlos@stocksystem.com" },
    update: {},
    create: {
      name: "Carlos Mendoza",
      email: "carlos@stocksystem.com",
      password: employeePassword,
      role: "EMPLOYEE",
      lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
  });

  const employee2 = await prisma.user.upsert({
    where: { email: "sofia@stocksystem.com" },
    update: {},
    create: {
      name: "Sofía Ramírez",
      email: "sofia@stocksystem.com",
      password: employeePassword,
      role: "EMPLOYEE",
      lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 48),
    },
  });

  console.log("✅ Users created");

  // ── Categories ─────────────────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: "Electrónica" },
      update: {},
      create: { name: "Electrónica", description: "Dispositivos electrónicos y accesorios" },
    }),
    prisma.category.upsert({
      where: { name: "Ropa y Accesorios" },
      update: {},
      create: { name: "Ropa y Accesorios", description: "Prendas de vestir y accesorios de moda" },
    }),
    prisma.category.upsert({
      where: { name: "Alimentos y Bebidas" },
      update: {},
      create: { name: "Alimentos y Bebidas", description: "Productos alimenticios y bebidas" },
    }),
    prisma.category.upsert({
      where: { name: "Hogar y Decoración" },
      update: {},
      create: { name: "Hogar y Decoración", description: "Artículos para el hogar y decoración" },
    }),
    prisma.category.upsert({
      where: { name: "Deportes" },
      update: {},
      create: { name: "Deportes", description: "Equipamiento y ropa deportiva" },
    }),
    prisma.category.upsert({
      where: { name: "Papelería" },
      update: {},
      create: { name: "Papelería", description: "Artículos de oficina y papelería" },
    }),
  ]);

  const [electro, ropa, alimentos, hogar, deportes, papeleria] = categories;
  console.log("✅ Categories created");

  // ── Products ───────────────────────────────────────────────────────────
  const productsData = [
    // Electrónica
    { name: "Auriculares Bluetooth Pro", sku: "ELEC-001", categoryId: electro.id, salePrice: 89.99, costPrice: 42.00, stock: 45, minStock: 10, supplier: "TechDistrib SA", unit: "unit" },
    { name: "Cable USB-C 2m", sku: "ELEC-002", categoryId: electro.id, salePrice: 12.99, costPrice: 4.50, stock: 3, minStock: 20, supplier: "TechDistrib SA", unit: "unit" },
    { name: "Cargador Rápido 65W", sku: "ELEC-003", categoryId: electro.id, salePrice: 34.99, costPrice: 16.00, stock: 18, minStock: 8, supplier: "TechDistrib SA", unit: "unit" },
    { name: "Mouse Inalámbrico", sku: "ELEC-004", categoryId: electro.id, salePrice: 29.99, costPrice: 12.00, stock: 0, minStock: 5, supplier: "TechDistrib SA", unit: "unit" },
    { name: "Teclado Mecánico TKL", sku: "ELEC-005", categoryId: electro.id, salePrice: 119.99, costPrice: 58.00, stock: 7, minStock: 5, supplier: "KeyMaster Pro", unit: "unit" },
    { name: "Webcam Full HD 1080p", sku: "ELEC-006", categoryId: electro.id, salePrice: 59.99, costPrice: 28.00, stock: 12, minStock: 6, supplier: "TechDistrib SA", unit: "unit" },
    // Ropa
    { name: "Camiseta Básica Algodón M", sku: "ROPA-001", categoryId: ropa.id, salePrice: 19.99, costPrice: 7.00, stock: 65, minStock: 20, supplier: "Textiles del Sur", unit: "unit" },
    { name: "Jean Skinny Azul T32", sku: "ROPA-002", categoryId: ropa.id, salePrice: 49.99, costPrice: 22.00, stock: 2, minStock: 10, supplier: "Textiles del Sur", unit: "unit" },
    { name: "Zapatillas Running Air", sku: "ROPA-003", categoryId: ropa.id, salePrice: 89.99, costPrice: 40.00, stock: 15, minStock: 8, supplier: "SportWear Co", unit: "unit" },
    { name: "Gorra Snapback Negra", sku: "ROPA-004", categoryId: ropa.id, salePrice: 24.99, costPrice: 9.00, stock: 30, minStock: 10, supplier: "Textiles del Sur", unit: "unit" },
    // Alimentos
    { name: "Café Molido Premium 500g", sku: "ALIM-001", categoryId: alimentos.id, salePrice: 14.99, costPrice: 7.20, stock: 48, minStock: 15, supplier: "Café Origen", unit: "unit" },
    { name: "Chocolate Negro 70% 100g", sku: "ALIM-002", categoryId: alimentos.id, salePrice: 4.99, costPrice: 2.10, stock: 4, minStock: 20, supplier: "Dulces Premium", unit: "unit" },
    { name: "Aceite de Oliva Extra Virgen 1L", sku: "ALIM-003", categoryId: alimentos.id, salePrice: 18.99, costPrice: 9.50, stock: 22, minStock: 10, supplier: "OliveMax", unit: "unit" },
    { name: "Agua Mineral 1.5L", sku: "ALIM-004", categoryId: alimentos.id, salePrice: 1.29, costPrice: 0.45, stock: 120, minStock: 50, supplier: "Aguas Puras SA", unit: "unit" },
    // Hogar
    { name: "Lámpara LED de Escritorio", sku: "HOGA-001", categoryId: hogar.id, salePrice: 39.99, costPrice: 18.00, stock: 8, minStock: 5, supplier: "HomeLight Co", unit: "unit" },
    { name: "Cojín Decorativo 45x45", sku: "HOGA-002", categoryId: hogar.id, salePrice: 22.99, costPrice: 9.00, stock: 0, minStock: 10, supplier: "Deco Home", unit: "unit" },
    { name: "Vela Aromática Vainilla", sku: "HOGA-003", categoryId: hogar.id, salePrice: 12.99, costPrice: 4.80, stock: 35, minStock: 12, supplier: "AromaShop", unit: "unit" },
    // Deportes
    { name: "Pelota de Fútbol Profesional", sku: "DEPO-001", categoryId: deportes.id, salePrice: 44.99, costPrice: 20.00, stock: 10, minStock: 5, supplier: "SportGear SA", unit: "unit" },
    { name: "Banda Resistencia Set x5", sku: "DEPO-002", categoryId: deportes.id, salePrice: 29.99, costPrice: 12.00, stock: 3, minStock: 8, supplier: "FitPro", unit: "set" },
    { name: "Botella de Agua 750ml", sku: "DEPO-003", categoryId: deportes.id, salePrice: 16.99, costPrice: 6.50, stock: 42, minStock: 15, supplier: "SportGear SA", unit: "unit" },
    // Papelería
    { name: "Cuaderno Rayado A4 100 hojas", sku: "PAPE-001", categoryId: papeleria.id, salePrice: 5.99, costPrice: 2.20, stock: 88, minStock: 30, supplier: "Papelera Central", unit: "unit" },
    { name: "Bolígrafo Azul Pack x12", sku: "PAPE-002", categoryId: papeleria.id, salePrice: 7.99, costPrice: 3.10, stock: 55, minStock: 20, supplier: "Papelera Central", unit: "pack" },
    { name: "Resma Papel A4 500h", sku: "PAPE-003", categoryId: papeleria.id, salePrice: 9.99, costPrice: 5.00, stock: 0, minStock: 10, supplier: "Papelera Central", unit: "unit" },
  ];

  const products = await Promise.all(
    productsData.map((p) =>
      prisma.product.upsert({
        where: { sku: p.sku },
        update: {},
        create: p,
      })
    )
  );

  console.log(`✅ ${products.length} Products created`);

  // ── Movements (last 35 days) ────────────────────────────────────────────
  const now = Date.now();
  const day = 1000 * 60 * 60 * 24;

  const movementsData = [
    // Entries (purchases)
    { productId: products[0].id, userId: manager.id, type: "ENTRY", reason: "PURCHASE", quantity: 50, date: new Date(now - 30 * day), notes: "Compra trimestral" },
    { productId: products[1].id, userId: manager.id, type: "ENTRY", reason: "PURCHASE", quantity: 100, date: new Date(now - 28 * day) },
    { productId: products[2].id, userId: manager.id, type: "ENTRY", reason: "PURCHASE", quantity: 30, date: new Date(now - 25 * day) },
    { productId: products[6].id, userId: manager.id, type: "ENTRY", reason: "PURCHASE", quantity: 80, date: new Date(now - 22 * day), notes: "Restock verano" },
    { productId: products[10].id, userId: manager.id, type: "ENTRY", reason: "PURCHASE", quantity: 60, date: new Date(now - 20 * day) },
    { productId: products[13].id, userId: manager.id, type: "ENTRY", reason: "PURCHASE", quantity: 200, date: new Date(now - 18 * day) },
    { productId: products[20].id, userId: manager.id, type: "ENTRY", reason: "PURCHASE", quantity: 150, date: new Date(now - 15 * day) },
    { productId: products[21].id, userId: manager.id, type: "ENTRY", reason: "PURCHASE", quantity: 80, date: new Date(now - 12 * day) },
    { productId: products[4].id, userId: admin.id,   type: "ENTRY", reason: "PURCHASE", quantity: 15, date: new Date(now - 10 * day), notes: "Nueva línea mecánica" },
    { productId: products[5].id, userId: manager.id, type: "ENTRY", reason: "PURCHASE", quantity: 20, date: new Date(now - 8 * day) },
    { productId: products[16].id, userId: manager.id, type: "ENTRY", reason: "PURCHASE", quantity: 50, date: new Date(now - 5 * day) },
    { productId: products[19].id, userId: manager.id, type: "ENTRY", reason: "PURCHASE", quantity: 60, date: new Date(now - 3 * day) },
    // Returns
    { productId: products[0].id, userId: employee1.id, type: "ENTRY", reason: "RETURN", quantity: 2, date: new Date(now - 14 * day), notes: "Devolución cliente — defecto de fábrica" },
    { productId: products[7].id, userId: employee1.id, type: "ENTRY", reason: "RETURN", quantity: 1, date: new Date(now - 7 * day), notes: "Devolución: talla incorrecta" },
    // Sales (exits)
    { productId: products[0].id, userId: employee1.id, type: "EXIT", reason: "SALE", quantity: 7, date: new Date(now - 27 * day) },
    { productId: products[1].id, userId: employee2.id, type: "EXIT", reason: "SALE", quantity: 97, date: new Date(now - 24 * day) },
    { productId: products[2].id, userId: employee1.id, type: "EXIT", reason: "SALE", quantity: 12, date: new Date(now - 21 * day) },
    { productId: products[6].id, userId: employee2.id, type: "EXIT", reason: "SALE", quantity: 15, date: new Date(now - 19 * day) },
    { productId: products[10].id, userId: employee1.id, type: "EXIT", reason: "SALE", quantity: 12, date: new Date(now - 17 * day) },
    { productId: products[13].id, userId: employee2.id, type: "EXIT", reason: "SALE", quantity: 80, date: new Date(now - 13 * day) },
    { productId: products[4].id, userId: employee1.id, type: "EXIT", reason: "SALE", quantity: 8, date: new Date(now - 9 * day) },
    { productId: products[20].id, userId: employee2.id, type: "EXIT", reason: "SALE", quantity: 62, date: new Date(now - 6 * day) },
    { productId: products[21].id, userId: employee1.id, type: "EXIT", reason: "SALE", quantity: 25, date: new Date(now - 4 * day) },
    { productId: products[19].id, userId: employee2.id, type: "EXIT", reason: "SALE", quantity: 18, date: new Date(now - 2 * day) },
    { productId: products[5].id, userId: employee1.id, type: "EXIT", reason: "SALE", quantity: 8, date: new Date(now - 1 * day) },
    { productId: products[16].id, userId: employee2.id, type: "EXIT", reason: "SALE", quantity: 15, date: new Date(now - 1 * day) },
    // Losses / Adjustments
    { productId: products[11].id, userId: manager.id, type: "EXIT", reason: "LOSS", quantity: 3, date: new Date(now - 16 * day), notes: "Caducidad — chocolates vencidos" },
    { productId: products[1].id, userId: admin.id, type: "EXIT", reason: "ADJUSTMENT", quantity: 0, date: new Date(now - 11 * day), notes: "Ajuste de inventario físico — descuadre 0 uds" },
    { productId: products[14].id, userId: employee1.id, type: "EXIT", reason: "LOSS", quantity: 1, date: new Date(now - 3 * day), notes: "Producto dañado en almacén" },
    // Today
    { productId: products[0].id, userId: employee1.id, type: "EXIT", reason: "SALE", quantity: 3, date: new Date() },
    { productId: products[10].id, userId: employee2.id, type: "EXIT", reason: "SALE", quantity: 5, date: new Date() },
    { productId: products[20].id, userId: employee1.id, type: "EXIT", reason: "SALE", quantity: 10, date: new Date() },
  ];

  for (const m of movementsData) {
    await prisma.movement.create({ data: m });
  }

  console.log(`✅ ${movementsData.length} Movements created`);

  // ── Audit Logs ─────────────────────────────────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      { userId: admin.id, action: "CREATE_USER", entity: "User", entityId: manager.id, details: JSON.stringify({ name: "Laura García", role: "MANAGER" }) },
      { userId: admin.id, action: "CREATE_USER", entity: "User", entityId: employee1.id, details: JSON.stringify({ name: "Carlos Mendoza", role: "EMPLOYEE" }) },
      { userId: admin.id, action: "CREATE_USER", entity: "User", entityId: employee2.id, details: JSON.stringify({ name: "Sofía Ramírez", role: "EMPLOYEE" }) },
      { userId: manager.id, action: "CREATE_PRODUCT", entity: "Product", entityId: products[0].id, details: JSON.stringify({ sku: "ELEC-001" }) },
      { userId: admin.id, action: "UPDATE_STOCK", entity: "Product", entityId: products[1].id, details: JSON.stringify({ reason: "Inventory audit adjustment" }) },
    ],
  });

  console.log("✅ Audit logs created");
  console.log("\n🎉 Seed complete!");
  console.log("\nDemo credentials:");
  console.log("  Admin:    admin@stocksystem.com     / admin123");
  console.log("  Manager:  manager@stocksystem.com   / manager123");
  console.log("  Employee: carlos@stocksystem.com    / employee123");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
