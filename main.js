// global variables
const itemList = document.querySelector(".itemList");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target); // Stop observing once visible
      }
    });
  },
  {
    threshold: 0.1, // Trigger when 10% of the item is visible
    rootMargin: "50px", // Start animation slightly before the item comes into view
  }
);

async function fetchItems() {
  try {
    const response = await fetch("items.json");
    if (!response.ok) {
      throw new Error("Failed to fetch items");
    }
    const items = await response.json();
    return items;
  } catch (error) {
    console.error("Error fetching items:", error);
    return {};
  }
}

const menuItems = await fetchItems();
// console.log(menuItems);

// Create a single menu item element
function createMenuItem(name, price) {
  const itemElement = document.createElement("div");
  itemElement.className = "menu-item";
  itemElement.innerHTML = `
    <span class="item-name">${name}</span>
    <span class="item-price">${price.toFixed(2)}</span>
  `;

  // Add to Intersection Observer
  observer.observe(itemElement);

  return itemElement;
}

// Create category header
function createCategoryHeader(category) {
  const categoryHeader = document.createElement("h2");
  categoryHeader.textContent = category.replace(/_/g, " ");
  return categoryHeader;
}

// Create items container
function createItemsContainer() {
  const container = document.createElement("div");
  container.className = "items-container";
  return container;
}

// Handle regular menu categories
function displayRegularCategory(category, items) {
  const categoryHeader = createCategoryHeader(category);
  const itemsContainer = createItemsContainer();

  items.forEach((item) => {
    const itemElement = createMenuItem(item.name, item.price);
    itemsContainer.appendChild(itemElement);
  });

  itemList.appendChild(categoryHeader);
  itemList.appendChild(itemsContainer);
}

// Handle pizza category specifically
function displayPizzaCategory(pizzaData) {
  const pizzaHeader = createCategoryHeader("Pizza");
  const pizzaContainer = createItemsContainer();

  Object.entries(pizzaData).forEach(([_size, pizzas]) => {
    pizzas.forEach((pizza) => {
      const pizzaElement = createMenuItem(pizza.name, pizza.price);
      pizzaContainer.appendChild(pizzaElement);
    });
  });

  itemList.appendChild(pizzaHeader);
  itemList.appendChild(pizzaContainer);
}

// Main display function
function displayMenuItems() {
  itemList.innerHTML = "";

  Object.entries(menuItems).forEach(([category, items]) => {
    if (category === "Pizza") return;
    displayRegularCategory(category, items);
  });

  if (menuItems.Pizza) {
    displayPizzaCategory(menuItems.Pizza);
  }
}

// Call the function to display menu items
displayMenuItems();
