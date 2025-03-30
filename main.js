// Constants
const ANIMATION_DELAYS = {
  COLLAPSE: 300,
  SCROLL: 500,
  EXPAND: 100,
};

const SELECTORS = {
  ITEM_LIST: ".itemList",
  MENU_TITLE: ".menu",
  NAV_CONTAINER: ".nav-container",
  CATEGORY_HEADER: ".category-header",
  CATEGORY_NAV: ".category-nav",
};

// Utility Functions
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const scrollToElement = (element, offset = 0) => {
  const navHeight = document.querySelector(
    SELECTORS.NAV_CONTAINER
  ).offsetHeight;
  const headerTop = element.getBoundingClientRect().top + window.pageYOffset;
  const scrollTarget = headerTop - navHeight - offset;

  window.scrollTo({
    top: scrollTarget,
    behavior: "smooth",
  });
};

// Category Management
class CategoryManager {
  static closeAllCategories() {
    document.querySelectorAll(SELECTORS.CATEGORY_HEADER).forEach((header) => {
      header.classList.add("collapsed");
      header.nextElementSibling.classList.add("collapsed");
    });
  }

  static openCategory(categoryHeader) {
    categoryHeader.classList.remove("collapsed");
    categoryHeader.nextElementSibling.classList.remove("collapsed");
  }

  static async navigateToCategory(categoryHeader, navButton) {
    // 1. Update active button state
    this.updateActiveButton(navButton);

    // 2. Close all categories
    this.closeAllCategories();
    await wait(ANIMATION_DELAYS.COLLAPSE);

    // 3. Scroll to position
    scrollToElement(categoryHeader, 10);
    await wait(ANIMATION_DELAYS.SCROLL);

    // 4. Open target category
    this.openCategory(categoryHeader);
  }

  static updateActiveButton(button) {
    const nav = button.closest(SELECTORS.CATEGORY_NAV);
    nav
      .querySelectorAll("button")
      .forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
  }
}

// Navigation Components
class NavigationArrow {
  constructor(direction, scrollAmount) {
    this.direction = direction;
    this.element = document.createElement("button");
    this.element.className = `nav-arrow ${direction}`;
    this.element.innerHTML = direction === "left" ? "❮" : "❯";
    this.scrollAmount = scrollAmount;
  }

  attachToNav(nav) {
    this.element.addEventListener("click", () => {
      // For RTL layout, we need to invert the scroll direction
      const scrollValue =
        this.direction === "left" ? -this.scrollAmount : this.scrollAmount;

      // Get the current scroll position
      const currentScroll = nav.scrollLeft;
      const targetScroll = currentScroll + scrollValue;

      nav.scrollTo({
        left: targetScroll,
        behavior: "smooth",
      });
    });
  }
}

class CategoryNavigation {
  constructor(menuItems) {
    this.menuItems = menuItems;
    this.scrollAmount = 300; // Increased scroll amount for better navigation
  }

  createNavContainer() {
    const container = document.createElement("div");
    container.className = "nav-container";
    return container;
  }

  createNav() {
    const nav = document.createElement("div");
    nav.className = "category-nav";
    return nav;
  }

  createCategoryButton(category) {
    const button = document.createElement("button");
    button.textContent = category.replace(/_/g, " ");

    button.addEventListener("click", async () => {
      const categoryHeader = document.querySelector(
        `h2[data-category="${category}"]`
      );
      await CategoryManager.navigateToCategory(categoryHeader, button);
    });

    return button;
  }

  setupArrowVisibility(nav, leftArrow, rightArrow) {
    const updateArrowsVisibility = () => {
      // For RTL layout, scrollLeft will be negative
      const maxScroll = nav.scrollWidth - nav.clientWidth;
      const currentScroll = Math.abs(nav.scrollLeft);

      // Update arrow visibility based on scroll position
      leftArrow.element.style.opacity =
        currentScroll >= maxScroll ? "0.3" : "1";
      rightArrow.element.style.opacity = currentScroll <= 0 ? "0.3" : "1";

      const shouldHide = maxScroll <= 0;
      leftArrow.element.style.visibility = shouldHide ? "hidden" : "visible";
      rightArrow.element.style.visibility = shouldHide ? "hidden" : "visible";
    };

    // Add scroll event listener
    nav.addEventListener("scroll", updateArrowsVisibility);

    // Add resize observer
    const resizeObserver = new ResizeObserver(updateArrowsVisibility);
    resizeObserver.observe(nav);

    // Initial check
    updateArrowsVisibility();
  }

  initialize() {
    const container = this.createNavContainer();
    const nav = this.createNav();

    const leftArrow = new NavigationArrow("left", this.scrollAmount);
    const rightArrow = new NavigationArrow("right", this.scrollAmount);

    leftArrow.attachToNav(nav);
    rightArrow.attachToNav(nav);

    Object.keys(this.menuItems).forEach((category) => {
      nav.appendChild(this.createCategoryButton(category));
    });

    container.appendChild(leftArrow.element);
    container.appendChild(nav);
    container.appendChild(rightArrow.element);

    nav.querySelector("button").classList.add("active");

    this.setupArrowVisibility(nav, leftArrow, rightArrow);

    document.querySelector(SELECTORS.MENU_TITLE).after(container);
  }
}

// Initialize
async function initialize() {
  try {
    // Wait for DOM to be fully loaded
    const itemList = document.querySelector(SELECTORS.ITEM_LIST);
    if (!itemList) {
      throw new Error("Item list element not found");
    }

    const menuItems = await fetchItems();
    itemList.innerHTML = "";

    Object.entries(menuItems).forEach(([category, items]) => {
      displayRegularCategory(category, items);
    });

    const navigation = new CategoryNavigation(menuItems);
    navigation.initialize();
  } catch (error) {
    console.error("Initialization error:", error);
  }
}

// Update how we start the application
document.addEventListener("DOMContentLoaded", () => {
  initialize();
});

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
// console.log(menuItems);  // I usse it for testing

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
  categoryHeader.className = "category-header collapsed";
  categoryHeader.dataset.category = category;
  categoryHeader.textContent = category.replace(/_/g, " ");

  categoryHeader.addEventListener("click", () => {
    categoryHeader.classList.toggle("collapsed");
    categoryHeader.nextElementSibling.classList.toggle("collapsed");
  });

  return categoryHeader;
}

// Create items container
function createItemsContainer() {
  const container = document.createElement("div");
  container.className = "items-container collapsed";
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
