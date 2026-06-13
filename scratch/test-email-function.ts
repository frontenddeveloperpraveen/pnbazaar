import { sendOrderConfirmedEmail } from "../src/lib/email";

async function run() {
  const payload = {
    orderId: "TEST-12345",
    customerName: "Test User",
    customerEmail: "iamkrpraveen@gmail.com",
    items: [
      {
        product: {
          name: "Test Product",
          price: 199,
          image: "https://via.placeholder.com/150",
        },
        quantity: 2,
      },
    ],
    subtotal: 398,
    discount: 0,
    deliveryFee: 50,
    total: 448,
    shippingAddress: {
      fullName: "Test User",
      addressLine: "123 Test St",
      city: "Test City",
      state: "Test State",
      pincode: "123456",
      phone: "1234567890",
    },
    paymentMethod: "cod",
    date: new Date().toISOString(),
  };

  try {
    console.log("Sending test confirmation email...");
    await sendOrderConfirmedEmail(payload);
    console.log("Email sent successfully!");
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

run();
