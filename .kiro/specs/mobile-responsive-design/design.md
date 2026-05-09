# Design Document: Mobile Responsive Design Adaptation

## Overview

This design document outlines the technical approach for implementing comprehensive mobile responsive design for the BLACK ONYX B2B portal. The solution transforms the existing desktop-first single-page application into a fully responsive, mobile-optimized experience using CSS media queries, flexible layouts, and touch-optimized interactions.

The implementation follows a mobile-first enhancement strategy where the existing desktop functionality is preserved while adding mobile-specific adaptations at defined breakpoints. The design prioritizes the Customer role initially, with patterns that can be extended to Manager and Admin roles.

### Key Design Principles

1. **Progressive Enhancement**: Desktop functionality remains intact while mobile enhancements are added
2. **Touch-First Interactions**: All interactive elements meet minimum 44x44px touch target requirements
3. **Performance Optimization**: Lazy loading and efficient resource delivery for mobile networks
4. **Consistent Patterns**: Reusable mobile UI patterns across all sections
5. **Graceful Degradation**: Fallbacks for browsers without modern CSS support

## Architecture

### High-Level Structure

The application maintains its existing single-page architecture with the following mobile adaptations:

```
┌─────────────────────────────────────┐
│         Viewport Detection          │
│    (CSS Media Queries + JS)         │
└─────────────────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
┌───▼────┐              ┌─────▼─────┐
│Desktop │              │  Mobile   │
│ Layout │              │  Layout   │
└────────┘              └───────────┘
    │                         │
    │                    ┌────▼─────┐
    │                    │ Bottom   │
    │                    │  Nav     │
    │                    └──────────┘
    │                         │
    └────────┬────────────────┘
             │
    ┌────────▼─────────┐
    │  Shared Content  │
    │   Components     │
    └──────────────────┘
```

### Responsive Breakpoint System

The design implements four breakpoints using CSS media queries:

- **Small Mobile**: `max-width: 479px` - Single column layouts, minimal spacing
- **Mobile**: `max-width: 767px` - Two column grids, bottom navigation
- **Tablet**: `min-width: 768px and max-width: 1024px` - Hybrid layouts
- **Desktop**: `min-width: 1025px` - Full sidebar, multi-column grids

### CSS Architecture

The existing CSS structure will be enhanced with:

1. **Mobile-specific utility classes** added to the existing utility system
2. **Responsive modifiers** using media query mixins
3. **Touch-optimized component variants** for buttons, inputs, and interactive elements
4. **Layout containers** with responsive grid systems

## Components and Interfaces

### 1. Bottom Navigation Component

**Purpose**: Replaces sidebar navigation on mobile devices (< 768px)

**Structure**:
```html
<nav class="bottom-nav">
  <a href="#home" class="bottom-nav-item active">
    <i class="fas fa-home"></i>
    <span>Home</span>
  </a>
  <a href="#catalog" class="bottom-nav-item">
    <i class="fas fa-th"></i>
    <span>Catalog</span>
  </a>
  <a href="#cart" class="bottom-nav-item">
    <i class="fas fa-shopping-cart"></i>
    <span class="bottom-nav-badge">3</span>
    <span>Cart</span>
  </a>
  <a href="#orders" class="bottom-nav-item">
    <i class="fas fa-box"></i>
    <span>Orders</span>
  </a>
  <a href="#profile" class="bottom-nav-item">
    <i class="fas fa-user"></i>
    <span>Profile</span>
  </a>
</nav>
```

**CSS Specifications**:
- Position: `fixed`, `bottom: 0`, `left: 0`, `right: 0`
- Height: `64px`
- Background: `var(--bg-card)` with `box-shadow: 0 -2px 12px rgba(0,0,0,0.08)`
- Z-index: `1000`
- Display: `flex`, `justify-content: space-around`
- Each item: `flex-direction: column`, `align-items: center`, `min-width: 44px`, `min-height: 44px`
- Active state: `color: var(--primary)`, bottom border indicator
- Badge: Absolute positioned circle on cart icon

**Behavior**:
- Hidden on desktop (>= 768px) using `display: none`
- Active section highlighted with primary color
- Badge updates dynamically via JavaScript when cart count changes
- Smooth transitions (250ms) between states

### 2. Mobile Header Component

**Purpose**: Compact header for mobile with expandable search

**Structure**:
```html
<header class="header mobile-header">
  <div class="header-logo">
    <div class="logo-icon">B</div>
    <span class="logo-text">BLACK ONYX</span>
  </div>
  <div class="header-search-mobile">
    <button class="search-toggle" id="searchToggle">
      <i class="fas fa-search"></i>
    </button>
    <div class="search-expandable" id="searchExpandable">
      <input type="text" placeholder="Search products..." class="search-input-mobile">
      <button class="search-close">
        <i class="fas fa-times"></i>
      </button>
    </div>
  </div>
</header>
```

**CSS Specifications**:
- Height: `56px` on mobile (reduced from 60px desktop)
- Padding: `12px 16px` (reduced from 32px)
- Logo text: Hidden on small mobile (< 480px)
- Search expandable: `position: absolute`, expands to full width minus logo
- Transition: `width 250ms ease`, `opacity 150ms ease`

**JavaScript Behavior**:
```javascript
// Search toggle functionality
searchToggle.addEventListener('click', () => {
  searchExpandable.classList.add('expanded');
  searchInputMobile.focus();
});

searchClose.addEventListener('click', () => {
  searchExpandable.classList.remove('expanded');
  searchInputMobile.value = '';
});
```

### 3. Bottom Sheet Component

**Purpose**: Mobile-optimized panel for filters and options

**Structure**:
```html
<div class="bottom-sheet-overlay" id="bottomSheetOverlay">
  <div class="bottom-sheet" id="bottomSheet">
    <div class="bottom-sheet-handle"></div>
    <div class="bottom-sheet-header">
      <h3 class="bottom-sheet-title">Filters</h3>
      <button class="bottom-sheet-close">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="bottom-sheet-content">
      <!-- Filter content here -->
    </div>
    <div class="bottom-sheet-footer">
      <button class="btn-secondary">Reset</button>
      <button class="btn-primary">Apply</button>
    </div>
  </div>
</div>
```

**CSS Specifications**:
- Overlay: `position: fixed`, full viewport, `background: rgba(0,0,0,0.5)`
- Sheet: `position: fixed`, `bottom: 0`, `left: 0`, `right: 0`
- Max height: `80vh`
- Border radius: `24px 24px 0 0`
- Handle: `width: 40px`, `height: 4px`, centered, for visual affordance
- Transform: `translateY(100%)` when hidden, `translateY(0)` when visible
- Transition: `transform 350ms cubic-bezier(0.4, 0, 0.2, 1)`

**JavaScript Behavior**:
```javascript
function openBottomSheet(contentType) {
  bottomSheetOverlay.classList.add('active');
  bottomSheet.classList.add('active');
  document.body.style.overflow = 'hidden';
  
  // Load content based on type (filters, sort, etc.)
  loadBottomSheetContent(contentType);
}

function closeBottomSheet() {
  bottomSheetOverlay.classList.remove('active');
  bottomSheet.classList.remove('active');
  document.body.style.overflow = '';
}

// Swipe down to close
let startY = 0;
bottomSheet.addEventListener('touchstart', (e) => {
  startY = e.touches[0].clientY;
});

bottomSheet.addEventListener('touchmove', (e) => {
  const currentY = e.touches[0].clientY;
  const diff = currentY - startY;
  
  if (diff > 0 && bottomSheet.scrollTop === 0) {
    bottomSheet.style.transform = `translateY(${diff}px)`;
  }
});

bottomSheet.addEventListener('touchend', (e) => {
  const diff = e.changedTouches[0].clientY - startY;
  
  if (diff > 100) {
    closeBottomSheet();
  } else {
    bottomSheet.style.transform = '';
  }
});
```

### 4. Swipeable List Item Component

**Purpose**: Enable swipe-to-delete and swipe-to-action on mobile

**Structure**:
```html
<div class="swipeable-item" data-item-id="123">
  <div class="swipeable-content">
    <!-- Item content -->
  </div>
  <div class="swipeable-actions">
    <button class="swipe-action delete">
      <i class="fas fa-trash"></i>
    </button>
  </div>
</div>
```

**CSS Specifications**:
- Container: `position: relative`, `overflow: hidden`
- Content: `position: relative`, `transition: transform 250ms ease`
- Actions: `position: absolute`, `right: 0`, `top: 0`, `bottom: 0`
- Action button: `width: 80px`, `height: 100%`, `background: var(--danger)`

**JavaScript Behavior**:
```javascript
class SwipeableItem {
  constructor(element) {
    this.element = element;
    this.content = element.querySelector('.swipeable-content');
    this.startX = 0;
    this.currentX = 0;
    this.isDragging = false;
    
    this.bindEvents();
  }
  
  bindEvents() {
    this.content.addEventListener('touchstart', (e) => {
      this.startX = e.touches[0].clientX;
      this.isDragging = true;
    });
    
    this.content.addEventListener('touchmove', (e) => {
      if (!this.isDragging) return;
      
      this.currentX = e.touches[0].clientX;
      const diff = this.currentX - this.startX;
      
      // Only allow left swipe
      if (diff < 0) {
        this.content.style.transform = `translateX(${Math.max(diff, -80)}px)`;
      }
    });
    
    this.content.addEventListener('touchend', () => {
      const diff = this.currentX - this.startX;
      
      if (diff < -40) {
        // Show delete button
        this.content.style.transform = 'translateX(-80px)';
      } else {
        // Reset
        this.content.style.transform = '';
      }
      
      this.isDragging = false;
    });
  }
  
  delete() {
    this.element.style.height = this.element.offsetHeight + 'px';
    this.element.style.transition = 'height 250ms ease, opacity 250ms ease';
    this.element.style.height = '0';
    this.element.style.opacity = '0';
    
    setTimeout(() => {
      this.element.remove();
    }, 250);
  }
}

// Initialize all swipeable items
document.querySelectorAll('.swipeable-item').forEach(item => {
  new SwipeableItem(item);
});
```

### 5. Responsive Product Grid

**Purpose**: Adaptive product grid that changes columns based on viewport

**CSS Specifications**:
```css
.product-grid {
  display: grid;
  gap: 16px;
  padding: 16px;
}

/* Desktop: 4 columns */
@media (min-width: 1025px) {
  .product-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
    padding: 32px;
  }
}

/* Tablet: 3 columns */
@media (min-width: 768px) and (max-width: 1024px) {
  .product-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    padding: 24px;
  }
}

/* Mobile: 2 columns */
@media (min-width: 480px) and (max-width: 767px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 16px;
  }
}

/* Small mobile: 1 column */
@media (max-width: 479px) {
  .product-grid {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 12px;
  }
}
```

### 6. Mobile Modal Component

**Purpose**: Fullscreen modals on mobile devices

**CSS Specifications**:
```css
.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  z-index: 2000;
}

@media (max-width: 767px) {
  .modal {
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    transform: none;
    width: 100%;
    max-width: 100%;
    max-height: 100%;
    border-radius: 0;
    animation: slideUp 350ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .modal-header {
    position: sticky;
    top: 0;
    background: var(--bg-card);
    border-bottom: 1px solid var(--border);
    padding: 16px;
    z-index: 1;
  }
  
  .modal-close {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 44px;
    height: 44px;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
```

### 7. Accordion Component

**Purpose**: Collapsible sections for product details on mobile

**Structure**:
```html
<div class="accordion">
  <div class="accordion-item">
    <button class="accordion-header">
      <span>Description</span>
      <i class="fas fa-chevron-down"></i>
    </button>
    <div class="accordion-content">
      <p>Product description content...</p>
    </div>
  </div>
</div>
```

**CSS Specifications**:
```css
.accordion-item {
  border-bottom: 1px solid var(--border);
}

.accordion-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: none;
  border: none;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
  cursor: pointer;
  min-height: 44px;
}

.accordion-header i {
  transition: transform 250ms ease;
}

.accordion-header.active i {
  transform: rotate(180deg);
}

.accordion-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 350ms ease;
}

.accordion-content.active {
  max-height: 1000px;
  padding: 0 16px 16px;
}
```

**JavaScript Behavior**:
```javascript
document.querySelectorAll('.accordion-header').forEach(header => {
  header.addEventListener('click', () => {
    const content = header.nextElementSibling;
    const isActive = header.classList.contains('active');
    
    // Close all other accordions (optional)
    document.querySelectorAll('.accordion-header').forEach(h => {
      h.classList.remove('active');
      h.nextElementSibling.classList.remove('active');
    });
    
    // Toggle current accordion
    if (!isActive) {
      header.classList.add('active');
      content.classList.add('active');
    }
  });
});
```

### 8. Toast Notification Component

**Purpose**: Mobile-positioned notifications

**CSS Specifications**:
```css
.toast-container {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: 80px; /* Above bottom nav */
  z-index: 3000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}

@media (min-width: 768px) {
  .toast-container {
    bottom: 16px;
    left: auto;
    right: 16px;
    max-width: 400px;
  }
}

.toast {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  pointer-events: auto;
  animation: slideInUp 250ms ease;
}

@keyframes slideInUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

## Data Models

### Viewport State

```javascript
const ViewportState = {
  width: window.innerWidth,
  height: window.innerHeight,
  breakpoint: 'desktop', // 'small-mobile' | 'mobile' | 'tablet' | 'desktop'
  isMobile: false,
  isTouch: false,
  
  update() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.breakpoint = this.getBreakpoint();
    this.isMobile = this.width < 768;
    this.isTouch = 'ontouchstart' in window;
  },
  
  getBreakpoint() {
    if (this.width < 480) return 'small-mobile';
    if (this.width < 768) return 'mobile';
    if (this.width < 1025) return 'tablet';
    return 'desktop';
  }
};
```

### Touch Gesture State

```javascript
const TouchGestureState = {
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0,
  startTime: 0,
  isDragging: false,
  
  reset() {
    this.startX = 0;
    this.startY = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.startTime = 0;
    this.isDragging = false;
  },
  
  getDistance() {
    return Math.sqrt(
      Math.pow(this.currentX - this.startX, 2) +
      Math.pow(this.currentY - this.startY, 2)
    );
  },
  
  getDirection() {
    const dx = this.currentX - this.startX;
    const dy = this.currentY - this.startY;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    } else {
      return dy > 0 ? 'down' : 'up';
    }
  },
  
  isSwipe() {
    const distance = this.getDistance();
    const duration = Date.now() - this.startTime;
    return distance > 50 && duration < 300;
  }
};
```

### Mobile Navigation State

```javascript
const MobileNavState = {
  activeSection: 'home',
  cartCount: 0,
  
  setActive(section) {
    this.activeSection = section;
    this.updateUI();
  },
  
  updateCartCount(count) {
    this.cartCount = count;
    this.updateBadge();
  },
  
  updateUI() {
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
      const href = item.getAttribute('href').substring(1);
      if (href === this.activeSection) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  },
  
  updateBadge() {
    const badge = document.querySelector('.bottom-nav-badge');
    if (badge) {
      badge.textContent = this.cartCount;
      badge.style.display = this.cartCount > 0 ? 'flex' : 'none';
    }
  }
};
```

## Data Flow

### Responsive Layout Initialization

```
Page Load
    │
    ├─> Detect Viewport Size
    │       │
    │       ├─> Set Breakpoint Class on <body>
    │       │   (mobile-small, mobile, tablet, desktop)
    │       │
    │       └─> Initialize Mobile Components
    │           (if viewport < 768px)
    │               │
    │               ├─> Show Bottom Navigation
    │               ├─> Hide Sidebar
    │               ├─> Apply Mobile Header
    │               └─> Initialize Touch Handlers
    │
    └─> Listen for Resize Events
            │
            └─> Debounced Update (250ms)
                    │
                    └─> Re-evaluate Breakpoint
                        and Update Layout
```

### Touch Gesture Processing

```
Touch Start
    │
    ├─> Record Start Position (x, y)
    ├─> Record Start Time
    └─> Set isDragging = true
    
Touch Move
    │
    ├─> Record Current Position
    ├─> Calculate Delta (dx, dy)
    └─> Apply Transform to Element
        (visual feedback)
    
Touch End
    │
    ├─> Calculate Final Delta
    ├─> Determine Gesture Type
    │   (swipe, tap, long-press)
    │
    └─> Execute Action
        │
        ├─> If Swipe Left > 40px
        │   └─> Show Delete Button
        │
        ├─> If Swipe Down > 100px
        │   └─> Close Bottom Sheet
        │
        └─> Otherwise
            └─> Reset Position
```

### Image Lazy Loading

```
Page Scroll
    │
    └─> Intersection Observer Callback
            │
            ├─> For Each Image in Viewport
            │       │
            │       ├─> Check if Already Loaded
            │       │
            │       └─> If Not Loaded
            │           │
            │           ├─> Get data-src Attribute
            │           ├─> Create New Image Object
            │           ├─> Set src = data-src
            │           │
            │           └─> On Load Complete
            │               │
            │               ├─> Replace Placeholder
            │               ├─> Add Fade-in Animation
            │               └─> Unobserve Element
            │
            └─> Continue Observing
```



## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Breakpoint Style Application

*For any* viewport width, the System should apply the correct breakpoint-specific styles: small-mobile styles for widths < 480px, mobile styles for widths 480-767px, tablet styles for widths 768-1024px, and desktop styles for widths > 1024px.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

### Property 2: Navigation Visibility Toggle

*For any* viewport width, when the width is less than 768px, the sidebar navigation should be hidden and the bottom navigation should be visible with exactly 5 icons; when the width is 768px or greater, the sidebar should be visible and the bottom navigation should be hidden.

**Validates: Requirements 2.1, 2.2, 2.8**

### Property 3: Cart Badge Display

*For any* cart item count greater than zero, the bottom navigation cart icon should display a badge showing the exact count; when the count is zero, the badge should not be displayed.

**Validates: Requirements 2.4**

### Property 4: Active Navigation Highlighting

*For any* active section in the application, the corresponding bottom navigation item should have the active class or styling applied, and all other navigation items should not have the active class.

**Validates: Requirements 2.7**

### Property 5: Mobile Header Compactness

*For any* viewport width less than 768px, the header should have reduced height compared to desktop, and the search should be displayed as an icon rather than an expanded input field.

**Validates: Requirements 3.1, 3.3**

### Property 6: Search Expansion Behavior

*For any* state where the search icon is clicked, the search input field should expand inline, receive focus automatically, and collapse back to icon form when a click occurs outside the search area.

**Validates: Requirements 3.4, 3.5, 3.6**

### Property 7: Carousel Mobile Sizing

*For any* viewport width less than 768px, the carousel component should have a height of exactly 200px and respond to touch swipe gestures for navigation.

**Validates: Requirements 4.1, 4.2**

### Property 8: Categories Horizontal Scroll

*For any* viewport width less than 768px, the categories container should have horizontal scrolling enabled with overflow-x set to scroll or auto.

**Validates: Requirements 4.3**

### Property 9: Product Grid Responsive Columns

*For any* viewport width, the product grid should display the correct number of columns: 1 column for widths < 480px, 2 columns for widths 480-767px, 3 columns for widths 768-1024px, and 4 columns for widths > 1024px.

**Validates: Requirements 4.4, 4.5, 5.6, 5.7**

### Property 10: Catalog Filter Controls

*For any* viewport width less than 768px, the catalog should display "Filters" and "Sort" buttons at the top, and clicking either button should display the corresponding options in a bottom sheet component.

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 11: Bottom Sheet Dismissal

*For any* open bottom sheet, clicking outside the sheet or performing a swipe-down gesture should close the bottom sheet and restore body scrolling.

**Validates: Requirements 5.5**

### Property 12: Product Card Swipe Actions

*For any* product card in a list, performing a swipe gesture should enable quick actions such as adding to cart or viewing details.

**Validates: Requirements 5.8**

### Property 13: Cart Single Column Layout

*For any* viewport width less than 768px, cart items should be displayed in a single column layout with the cart total block fixed at the bottom of the viewport.

**Validates: Requirements 6.1, 6.5**

### Property 14: Touch Target Minimum Size

*For any* interactive element in the application (buttons, links, inputs, icons), the element should have minimum dimensions of 44x44px to ensure touch-friendly interaction.

**Validates: Requirements 6.2, 10.1**

### Property 15: Cart Item Swipe to Delete

*For any* cart item, swiping left should reveal a delete button, and completing the swipe gesture should remove the item from the cart with animation.

**Validates: Requirements 6.3, 6.4, 10.4**

### Property 16: Interactive Element Spacing

*For any* pair of adjacent interactive elements, the spacing between them should be at least 8px to prevent accidental taps.

**Validates: Requirements 6.7, 10.2**

### Property 17: Product Image Full Width

*For any* viewport width less than 768px on the product details page, the product image should be displayed at full viewport width and support pinch-to-zoom gestures.

**Validates: Requirements 7.1, 7.2**

### Property 18: Product Details Accordion

*For any* viewport width less than 768px, product description sections should be rendered as accordion components, and tapping an accordion header should toggle the expansion state of that section.

**Validates: Requirements 7.3, 7.4**

### Property 19: Product Characteristics List Layout

*For any* viewport width less than 768px, product characteristics should be displayed as a vertical list rather than a table, with each characteristic as a separate list item.

**Validates: Requirements 7.5**

### Property 20: Add to Cart Button Positioning

*For any* viewport width less than 768px on the product details page, the "Add to Cart" button should be positioned fixed at the bottom of the viewport with minimum height of 44px.

**Validates: Requirements 7.6, 7.7**

### Property 21: Orders Card Layout

*For any* viewport width less than 768px, orders should be displayed as individual cards (not a table), with each card containing order number, date, status badge, and total amount.

**Validates: Requirements 8.1, 8.2**

### Property 22: Order Card Navigation

*For any* order card, tapping the card should navigate to the order details page for that specific order.

**Validates: Requirements 8.3**

### Property 23: Order Status Badge Colors

*For any* order status value, the status badge should display with the appropriate color: green for completed, yellow for pending, red for cancelled, blue for processing.

**Validates: Requirements 8.4**

### Property 24: Order Details Vertical Layout

*For any* viewport width less than 768px, order details should be displayed in a vertical layout with all information stacked.

**Validates: Requirements 8.6**

### Property 25: Profile Form Mobile Layout

*For any* viewport width less than 768px, profile form fields should be displayed in a vertical stacked layout with labels above inputs, and all input fields should have minimum height of 48px.

**Validates: Requirements 9.1, 9.2, 9.3**

### Property 26: Form Button Full Width

*For any* viewport width less than 768px, form action buttons should be displayed at full width (100% of container).

**Validates: Requirements 9.4**

### Property 27: Mobile Keyboard Types

*For any* input field, the appropriate mobile keyboard type should be enabled based on the input type: numeric for numbers, email for email addresses, tel for phone numbers, etc.

**Validates: Requirements 9.5**

### Property 28: Input Field Scroll Into View

*For any* input field that receives focus, if the field is obscured by the mobile keyboard, the system should automatically scroll the field into view.

**Validates: Requirements 9.6**

### Property 29: Swipe Gesture Status Changes

*For any* element that supports status changes, swipe gestures should be enabled to trigger status change actions.

**Validates: Requirements 10.5**

### Property 30: Double-Tap Zoom Prevention

*For any* interactive element, double-tap zoom should be prevented through CSS touch-action property or event handling to avoid accidental zoom during interaction.

**Validates: Requirements 10.6**

### Property 31: Modal Fullscreen on Mobile

*For any* modal window and viewport width less than 768px, the modal should be displayed in fullscreen mode with a close button in the top-right corner.

**Validates: Requirements 11.1, 11.2**

### Property 32: Modal Swipe to Close

*For any* fullscreen modal on mobile, performing a swipe-down gesture should close the modal.

**Validates: Requirements 11.3**

### Property 33: Modal Background Scroll Lock

*For any* modal window, when the modal opens, background content scrolling should be prevented (body overflow: hidden), and when the modal closes, scrolling should be restored.

**Validates: Requirements 11.4, 11.5**

### Property 34: Mobile Typography Scaling

*For any* heading element and viewport width less than 768px, the font size should be reduced by 20% compared to the desktop font size.

**Validates: Requirements 12.1**

### Property 35: Button Text Minimum Size

*For any* button element, the text font size should be at least 16px to ensure readability on mobile devices.

**Validates: Requirements 12.4**

### Property 36: Text Contrast Compliance

*For any* text element, the contrast ratio between text color and background color should meet WCAG AA standards (minimum 4.5:1 for normal text, 3:1 for large text).

**Validates: Requirements 12.5**

### Property 37: Mobile Spacing Reduction

*For any* viewport width less than 768px, padding should be reduced from 32px to 16px and gap spacing should be reduced from 24px to 12px across all applicable elements.

**Validates: Requirements 13.1, 13.2**

### Property 38: Toast Mobile Positioning

*For any* viewport width less than 768px, toast notifications should be positioned at the bottom of the viewport, above the bottom navigation bar (if present).

**Validates: Requirements 14.1, 14.2**

### Property 39: Toast Vertical Stacking

*For any* scenario where multiple toast notifications are displayed simultaneously, they should be stacked vertically with consistent spacing between them.

**Validates: Requirements 14.4**

### Property 40: Toast Swipe Dismissal

*For any* toast notification, performing a swipe gesture (left or right) should dismiss the toast immediately.

**Validates: Requirements 14.5**

### Property 41: Image Lazy Loading

*For any* product image in the application, the image should implement lazy loading (either through loading="lazy" attribute or Intersection Observer API).

**Validates: Requirements 15.1**

### Property 42: Image Load on Viewport Entry

*For any* lazy-loaded image, when the image enters the viewport (becomes visible), the image should begin loading.

**Validates: Requirements 15.2**

### Property 43: Responsive Image Sources

*For any* image element, appropriate image sources should be provided based on device pixel density using srcset or picture elements.

**Validates: Requirements 15.3**

### Property 44: Table to Card Conversion

*For any* table element and viewport width less than 768px, the table should be converted to a card-based layout where each table row becomes an individual card.

**Validates: Requirements 16.1, 16.2**

### Property 45: Card Label Preservation

*For any* table converted to cards, each card should display the table column headers as labels within the card, maintaining the data relationships from the original table.

**Validates: Requirements 16.3, 16.4**

### Property 46: Consistent Card Styling

*For any* table converted to cards, all resulting cards should have consistent styling (same CSS classes, padding, borders, shadows) regardless of the source table.

**Validates: Requirements 16.5**

## Error Handling

### Viewport Detection Errors

**Error Condition**: Browser does not support window.innerWidth or media queries

**Handling Strategy**:
- Provide fallback using document.documentElement.clientWidth
- Apply mobile-first CSS that works without media query support
- Log warning to console for debugging

**Implementation**:
```javascript
function getViewportWidth() {
  return window.innerWidth 
    || document.documentElement.clientWidth 
    || document.body.clientWidth 
    || 1024; // Default to desktop if all fail
}
```

### Touch Event Errors

**Error Condition**: Browser does not support touch events

**Handling Strategy**:
- Detect touch support using 'ontouchstart' in window
- Fall back to mouse events for swipe gestures
- Provide alternative click-based interactions

**Implementation**:
```javascript
const hasTouch = 'ontouchstart' in window;

if (hasTouch) {
  element.addEventListener('touchstart', handleTouchStart);
  element.addEventListener('touchmove', handleTouchMove);
  element.addEventListener('touchend', handleTouchEnd);
} else {
  element.addEventListener('mousedown', handleMouseDown);
  element.addEventListener('mousemove', handleMouseMove);
  element.addEventListener('mouseup', handleMouseUp);
}
```

### Image Loading Errors

**Error Condition**: Image fails to load (404, network error, etc.)

**Handling Strategy**:
- Display placeholder image or icon
- Log error for monitoring
- Retry loading after delay (max 3 attempts)
- Show "Image unavailable" message if all retries fail

**Implementation**:
```javascript
function loadImageWithRetry(img, src, retries = 3) {
  img.src = src;
  
  img.onerror = () => {
    if (retries > 0) {
      setTimeout(() => {
        loadImageWithRetry(img, src, retries - 1);
      }, 1000);
    } else {
      img.src = '/img/placeholder.png';
      img.alt = 'Image unavailable';
    }
  };
}
```

### Intersection Observer Errors

**Error Condition**: Browser does not support Intersection Observer API

**Handling Strategy**:
- Detect support before using
- Fall back to loading="lazy" attribute
- If neither supported, load all images immediately

**Implementation**:
```javascript
if ('IntersectionObserver' in window) {
  // Use Intersection Observer for lazy loading
  const observer = new IntersectionObserver(handleIntersection);
  images.forEach(img => observer.observe(img));
} else if ('loading' in HTMLImageElement.prototype) {
  // Use native lazy loading
  images.forEach(img => img.loading = 'lazy');
} else {
  // Load all images immediately
  images.forEach(img => img.src = img.dataset.src);
}
```

### Local Storage Errors

**Error Condition**: Local storage is full or unavailable (private browsing)

**Handling Strategy**:
- Wrap all localStorage calls in try-catch
- Fall back to session storage if available
- Use in-memory storage as last resort
- Notify user if persistence is unavailable

**Implementation**:
```javascript
class Storage {
  constructor() {
    this.storage = this.detectStorage();
  }
  
  detectStorage() {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return localStorage;
    } catch (e) {
      try {
        return sessionStorage;
      } catch (e) {
        return new Map(); // In-memory fallback
      }
    }
  }
  
  setItem(key, value) {
    try {
      this.storage.set ? 
        this.storage.set(key, value) : 
        this.storage.setItem(key, value);
    } catch (e) {
      console.warn('Storage unavailable:', e);
    }
  }
}
```

### CSS Animation Errors

**Error Condition**: Browser does not support CSS transitions or animations

**Handling Strategy**:
- Detect support using CSS.supports()
- Apply instant state changes without animation
- Ensure functionality works without animations

**Implementation**:
```javascript
const supportsTransitions = CSS.supports('transition', 'transform 250ms');

function applyTransition(element, property, value) {
  if (supportsTransitions) {
    element.style.transition = `${property} 250ms ease`;
    element.style[property] = value;
  } else {
    element.style[property] = value;
  }
}
```

### Gesture Recognition Errors

**Error Condition**: Touch gesture is ambiguous or conflicts with browser gestures

**Handling Strategy**:
- Set minimum distance thresholds (50px for swipe)
- Set maximum duration (300ms for swipe)
- Use preventDefault() carefully to avoid breaking browser navigation
- Provide visual feedback during gesture

**Implementation**:
```javascript
function isValidSwipe(startX, startY, endX, endY, duration) {
  const distance = Math.sqrt(
    Math.pow(endX - startX, 2) + 
    Math.pow(endY - startY, 2)
  );
  
  return distance > 50 && duration < 300;
}

function handleTouchMove(e) {
  // Only prevent default if we're sure it's our gesture
  if (Math.abs(currentX - startX) > 10) {
    e.preventDefault(); // Prevent scroll
  }
}
```

## Testing Strategy

### Dual Testing Approach

The mobile responsive design implementation requires both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and integration points
- Specific viewport width examples (320px, 375px, 768px, 1024px)
- Edge cases like empty cart, no orders, missing images
- Integration between components (bottom nav + page content)
- Browser compatibility fallbacks

**Property-Based Tests**: Verify universal properties across all inputs
- Breakpoint behavior across continuous range of viewport widths
- Touch target sizes across all interactive elements
- Spacing consistency across all components
- Color contrast across all text elements

Both testing approaches are complementary and necessary for comprehensive coverage. Unit tests catch concrete bugs in specific scenarios, while property-based tests verify general correctness across the full input space.

### Property-Based Testing Configuration

**Testing Library**: fast-check (JavaScript/TypeScript property-based testing library)

**Configuration**:
- Minimum 100 iterations per property test (due to randomization)
- Each test tagged with feature name and property number
- Tag format: `Feature: mobile-responsive-design, Property {N}: {property_text}`

**Example Property Test Structure**:
```javascript
import fc from 'fast-check';

// Feature: mobile-responsive-design, Property 1: Breakpoint Style Application
test('Property 1: Correct breakpoint styles applied for any viewport width', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 320, max: 2560 }), // Generate random viewport widths
      (viewportWidth) => {
        // Set viewport width
        setViewportWidth(viewportWidth);
        
        // Get applied breakpoint
        const breakpoint = getAppliedBreakpoint();
        
        // Verify correct breakpoint
        if (viewportWidth < 480) {
          expect(breakpoint).toBe('small-mobile');
        } else if (viewportWidth < 768) {
          expect(breakpoint).toBe('mobile');
        } else if (viewportWidth < 1025) {
          expect(breakpoint).toBe('tablet');
        } else {
          expect(breakpoint).toBe('desktop');
        }
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: mobile-responsive-design, Property 14: Touch Target Minimum Size
test('Property 14: All interactive elements meet 44x44px minimum', () => {
  fc.assert(
    fc.property(
      fc.constantFrom('button', 'a', 'input', '[role="button"]'),
      (selector) => {
        const elements = document.querySelectorAll(selector);
        
        elements.forEach(element => {
          const rect = element.getBoundingClientRect();
          expect(rect.width).toBeGreaterThanOrEqual(44);
          expect(rect.height).toBeGreaterThanOrEqual(44);
        });
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing Strategy

**Testing Framework**: Jest with jsdom for DOM manipulation

**Test Categories**:

1. **Viewport Detection Tests**
   - Test specific breakpoint widths (320px, 480px, 768px, 1024px, 1920px)
   - Test viewport resize handling
   - Test breakpoint class application to body element

2. **Component Rendering Tests**
   - Test bottom navigation renders with 5 items
   - Test sidebar visibility at different breakpoints
   - Test modal fullscreen mode on mobile
   - Test accordion expand/collapse

3. **Touch Gesture Tests**
   - Test swipe left reveals delete button
   - Test swipe down closes bottom sheet
   - Test pinch zoom on images
   - Test tap feedback

4. **Layout Tests**
   - Test product grid column counts at each breakpoint
   - Test table to card conversion
   - Test form field stacking on mobile
   - Test spacing reduction on mobile

5. **Integration Tests**
   - Test bottom nav + page content interaction
   - Test modal + background scroll lock
   - Test search expand + header layout
   - Test cart badge + cart count sync

6. **Error Handling Tests**
   - Test image load failure fallback
   - Test localStorage unavailable fallback
   - Test touch event unsupported fallback
   - Test Intersection Observer unsupported fallback

**Example Unit Test**:
```javascript
describe('Bottom Navigation', () => {
  test('should display 5 navigation items on mobile', () => {
    setViewportWidth(375);
    render(<App />);
    
    const navItems = screen.getAllByRole('link', { 
      name: /home|catalog|cart|orders|profile/i 
    });
    
    expect(navItems).toHaveLength(5);
  });
  
  test('should hide bottom nav on desktop', () => {
    setViewportWidth(1024);
    render(<App />);
    
    const bottomNav = screen.queryByTestId('bottom-nav');
    expect(bottomNav).not.toBeVisible();
  });
  
  test('should update cart badge when cart count changes', () => {
    setViewportWidth(375);
    const { rerender } = render(<App cartCount={0} />);
    
    let badge = screen.queryByTestId('cart-badge');
    expect(badge).not.toBeInTheDocument();
    
    rerender(<App cartCount={3} />);
    badge = screen.getByTestId('cart-badge');
    expect(badge).toHaveTextContent('3');
  });
});
```

### Visual Regression Testing

**Tool**: Percy or Chromatic for visual diff testing

**Test Scenarios**:
- Capture screenshots at each breakpoint (320px, 375px, 768px, 1024px, 1920px)
- Test each major page (home, catalog, cart, orders, profile, product details)
- Test interactive states (hover, focus, active, disabled)
- Test modal and bottom sheet appearances
- Compare against baseline to detect unintended visual changes

### Performance Testing

**Metrics to Monitor**:
- First Contentful Paint (FCP) < 1.8s on 3G
- Largest Contentful Paint (LCP) < 2.5s on 3G
- Time to Interactive (TTI) < 3.8s on 3G
- Cumulative Layout Shift (CLS) < 0.1
- Total Blocking Time (TBT) < 200ms

**Tools**:
- Lighthouse CI for automated performance testing
- WebPageTest for real-world network conditions
- Chrome DevTools Performance panel for profiling

### Accessibility Testing

**Automated Tests**:
- axe-core for WCAG compliance
- Test color contrast ratios (Property 36)
- Test touch target sizes (Property 14)
- Test keyboard navigation
- Test screen reader compatibility

**Manual Tests**:
- Test with real screen readers (NVDA, JAWS, VoiceOver)
- Test with keyboard only (no mouse)
- Test with touch only (no keyboard)
- Test with zoom enabled (200%, 400%)

### Cross-Browser Testing

**Target Browsers**:
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

**Test Approach**:
- Use BrowserStack or Sauce Labs for automated cross-browser testing
- Test all property-based tests across all browsers
- Test fallbacks for unsupported features
- Verify touch gestures on real mobile devices

### Test Execution Strategy

1. **Development**: Run unit tests on every file save (watch mode)
2. **Pre-commit**: Run all unit tests + linting
3. **CI Pipeline**: Run all tests (unit + property-based) + visual regression
4. **Pre-release**: Run full test suite + manual accessibility testing + cross-browser testing
5. **Post-release**: Monitor real user metrics (Core Web Vitals, error rates)
