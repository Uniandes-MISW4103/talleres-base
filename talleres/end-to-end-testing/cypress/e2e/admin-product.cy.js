describe("Admin Panel - Product Management", () => {
  /**
   * Este beforeEach se ejecuta antes de cada test
   * Automatiza el login del administrador para que no tenga que repetir este código
   */
  beforeEach(() => {
    // Visitar la página de login del admin
    cy.visit("/admin/login");

    // Llenar el formulario de login
    cy.get('input[name="email"]').type("admin@test.com");
    cy.get('input[name="password"]').type("admin123");

    // Hacer click en el botón de login
    cy.get('button[type="submit"]').click();

    // Esperar a que la navegación al dashboard del admin sea exitosa
    cy.url().should("include", "/admin");
    cy.contains("Dashboard", { timeout: 10000 }).should("be.visible");
  });

  /**
   * Test completo: Crear un nuevo producto
   * Este test está implementado como referencia
   */
  it("creates a new product successfully", () => {
    // Navegar a la sección de productos
    cy.contains("Catalog").click();
    cy.contains("Products").click();
    cy.url().should("include", "/admin/products");

    // Click en crear nuevo producto
    cy.contains("button", "New Product", { timeout: 5000 }).click();

    // Llenar información básica del producto
    cy.get('input[name="name"]').type("Cypress Test Product");

    // Establecer precio
    cy.get('input[name="price"]').clear().type("99.99");

    // Establecer SKU (código único del producto)
    const uniqueSKU = `TEST-${Date.now()}`;
    cy.get('input[name="sku"]').type(uniqueSKU);

    // Establecer cantidad en stock
    cy.get('input[name="qty"]').clear().type("10");

    // Establecer Tax Class (combobox personalizado)
    cy.get('button[id="field-tax_class"]').click();
    cy.contains("Taxable Goods").click();

    // Establecer URL Key
    cy.get('input[name="url_key"]').type("cypress-test-product");

    // Establecer Meta Title
    cy.get('input[name="meta_title"]').type("Cypress Test Product");

    // Establecer Weight
    cy.get('input[name="weight"]').type("1.5");

    // Guardar el producto
    cy.contains("button", "Save").click();

    // Verificar que el producto fue creado exitosamente
    cy.contains("Product created successfully", { timeout: 10000 }).should(
      "be.visible"
    );

    // Hacer click en el botón de regresar a la lista de productos (breadcrumb)
    cy.get('a[href*="/admin/products"]').eq(2).click();

    // Verificar que estamos de vuelta en la lista de productos
    cy.url().should("include", "/admin/products");

    // Verificar que el producto aparece en la lista
    cy.contains("Cypress Test Product").should("be.visible");
  });
});
