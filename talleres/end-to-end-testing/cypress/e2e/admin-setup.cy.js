describe("Admin Panel - Initial Setup", () => {
  beforeEach(() => {
    // Login del administrador
    cy.visit("/admin/login");
    cy.get('input[name="email"]').type("admin@test.com");
    cy.get('input[name="password"]').type("admin123");
    cy.get('button[type="submit"]').click();
    cy.url().should("include", "/admin");
    cy.contains("Dashboard", { timeout: 10000 }).should("be.visible");
  });

  /**
   * Configurar métodos de pago y envío
   */
  it("configures store settings for checkout", () => {

    // Paso 1: Ir a Setting
    cy.contains("Setting").click();
    cy.contains("Store").click();
    cy.url().should("include", "/admin/setting/store");

    // Paso 2: Activar Cash on Delivery
    cy.contains("Payment").click();
    cy.url().should("include", "/admin/setting/payments");
    
    // Buscar Cash On Delivery y hacer click en el botón de settings
    cy.contains("Cash On Delivery", { timeout: 5000 }).should("be.visible");

    // Activar el switch de Cash on Delivery
    cy.get('span[role="switch"][aria-checked="false"]').eq(2).click();

    // Guardar
    cy.contains("button", "Save").click();
    cy.contains("Payment setting saved", { timeout: 10000 }).should("be.visible");

    // Paso 3: Configurar Shipping Zones y Methods
    cy.contains("Shipping").click();
    cy.url().should("include", "/admin/setting/shipping");

    // Click en "Create New Zone"
    cy.contains("button", "Create New Zone", { timeout: 5000 }).click();

    // Llenar el formulario del dialog de zona
    // Nombre de la zona
    cy.get('input[name="name"]').type("United States Zone");

    // Seleccionar país (United States)
    cy.get('input[id="field-country"]').click();
    cy.contains("United States", { timeout: 5000 }).click();

    // Seleccionar provincia (New York)
    cy.get('input[id="field-provinces"]').click();
    cy.contains("New York", { timeout: 5000 }).click();
    // Click fuera del dropdown para cerrarlo
    cy.get('input[name="name"]').click();

    // Guardar la zona
    cy.get('form[id="createShippingZone"]').within(() => {
      cy.contains("button", "Save").click();
    });

    // Paso 4: Agregar método de envío
    cy.contains("button", "+ Add Method", { timeout: 5000 }).click();

    // En el dialog de shipping method
    // Escribir nombre del método de envío (esto crea uno nuevo)
    cy.get('input[id="field-method_id"]').type("Standard Shipping{enter}");

    // Habilitar el método (activar switch de status)
    cy.get('form[id="shippingMethodForm"]').within(() => {
      cy.get('span[role="switch"][aria-checked="false"]').click();
    });

    // El radio "Flat rate" ya está seleccionado por defecto

    // Llenar el costo del envío
    cy.get('input[name="cost"]').clear().type("10.00");

    // Guardar el método de envío
    cy.get('form[id="shippingMethodForm"]').within(() => {
      cy.contains("button", "Save").click();
    });

    cy.contains("successfully", { timeout: 10000 }).should("be.visible");

    // Regresar al dashboard
    cy.contains("Dashboard").click();
    cy.url().should("include", "/admin");
  });
});
