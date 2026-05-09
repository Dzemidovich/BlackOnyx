# Implementation Plan: Mobile Responsive Design Adaptation

## Overview

This implementation plan breaks down the mobile responsive design adaptation into incremental, testable steps. The approach follows a component-by-component strategy, implementing mobile adaptations while preserving existing desktop functionality. Each task builds on previous work, with testing integrated throughout to catch issues early.

The implementation focuses on the Customer role first, with patterns that can be extended to Manager and Admin roles later.

## Tasks

- [ ] 1. Set up responsive foundation and viewport detection
  - Add CSS custom properties for mobile breakpoints
  - Implement viewport detection JavaScript module
  - Add breakpoint classes to body element on load and resize
  - Create utility functions for viewport queries
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6_

- [ ]* 1.1 Write property test for breakpoint detection
  - **Property 1: Breakpoint Style Application**
  - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

- [ ] 2. Implement bottom navigation component
  - [ ] 2.1 Create bottom navigation HTML structure
    - Add bottom-nav container with 5 navigation items
    - Include icons for Home, Catalog, Cart, Orders, Profile
    - Add cart badge element for item count display
    - _Requirements: 2.2, 2.3_
  
  - [ ] 2.2 Style bottom navigation for mobile
    - Position fixed at bottom with proper z-index
    - Style navigation items with flexbox layout
    - Implement active state styling
    - Add cart badge positioning and styling
    - Hide on desktop (>= 768px) with media query
    - _Requirements: 2.2, 2.5, 2.8_
  
  - [ ] 2.3 Implement bottom navigation JavaScript
    - Add click handlers for navigation items
    - Implement active section tracking
    - Create cart badge update function
    - Sync with existing navigation system
    - _Requirements: 2.6, 2.7_
  
  - [ ]* 2.4 Write property tests for bottom navigation
    - **Property 2: Navigation Visibility Toggle**
    - **Property 3: Cart Badge Display**
    - **Property 4: Active Navigation Highlighting**
    - **Validates: Requirements 2.1, 2.2, 2.4, 2.7, 2.8**

- [ ] 3. Adapt header for mobile
  - [ ] 3.1 Create mobile header styles
    - Reduce header height on mobile
    - Adjust logo sizing for small screens
    - Hide logo text on small mobile (< 480px)
    - _Requirements: 3.1, 3.2_
  
  - [ ] 3.2 Implement expandable search
    - Create search toggle button with icon
    - Build expandable search container
    - Style search expansion animation
    - Add close button for expanded search
    - _Requirements: 3.3_
  
  - [ ] 3.3 Add search interaction JavaScript
    - Implement search toggle click handler
    - Add auto-focus on expansion
    - Implement click-outside to collapse
    - Add close button handler
    - _Requirements: 3.4, 3.5, 3.6_
  
  - [ ]* 3.4 Write property tests for mobile header
    - **Property 5: Mobile Header Compactness**
    - **Property 6: Search Expansion Behavior**
    - **Validates: Requirements 3.1, 3.3, 3.4, 3.5, 3.6**

- [ ] 4. Checkpoint - Verify navigation and header
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement responsive product grid
  - [ ] 5.1 Create responsive grid CSS
    - Define grid-template-columns for each breakpoint
    - Adjust gap spacing for mobile (24px → 12px)
    - Adjust padding for mobile (32px → 16px)
    - _Requirements: 4.4, 4.5, 13.1, 13.2_
  
  - [ ]* 5.2 Write property test for product grid
    - **Property 9: Product Grid Responsive Columns**
    - **Property 37: Mobile Spacing Reduction**
    - **Validates: Requirements 4.4, 4.5, 5.6, 5.7, 13.1, 13.2**

- [ ] 6. Adapt home page for mobile
  - [ ] 6.1 Implement mobile carousel
    - Set carousel height to 200px on mobile
    - Add touch event handlers for swipe navigation
    - Implement swipe gesture detection
    - _Requirements: 4.1, 4.2_
  
  - [ ] 6.2 Create horizontal scrolling categories
    - Style categories container with overflow-x: scroll
    - Enable momentum scrolling with -webkit-overflow-scrolling
    - Adjust category card sizing for mobile
    - _Requirements: 4.3_
  
  - [ ]* 6.3 Write property tests for home page
    - **Property 7: Carousel Mobile Sizing**
    - **Property 8: Categories Horizontal Scroll**
    - **Validates: Requirements 4.1, 4.2, 4.3**

- [ ] 7. Implement bottom sheet component
  - [ ] 7.1 Create bottom sheet HTML structure
    - Build overlay element
    - Create sheet container with handle
    - Add header with title and close button
    - Add content area and footer
    - _Requirements: 5.2, 5.3_
  
  - [ ] 7.2 Style bottom sheet
    - Position fixed at bottom with transform
    - Add slide-up animation with cubic-bezier
    - Style overlay with semi-transparent background
    - Add border-radius to top corners
    - _Requirements: 5.2, 5.3_
  
  - [ ] 7.3 Implement bottom sheet JavaScript
    - Create open/close functions
    - Add swipe-down to close gesture
    - Implement click-outside to close
    - Add body scroll lock when open
    - _Requirements: 5.5_
  
  - [ ]* 7.4 Write property tests for bottom sheet
    - **Property 10: Catalog Filter Controls**
    - **Property 11: Bottom Sheet Dismissal**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.5**

- [ ] 8. Adapt catalog page for mobile
  - [ ] 8.1 Add filter and sort buttons
    - Create "Filters" and "Sort" buttons for mobile
    - Position at top of catalog
    - Hide desktop filter sidebar on mobile
    - _Requirements: 5.1_
  
  - [ ] 8.2 Connect filters to bottom sheet
    - Wire "Filters" button to open bottom sheet
    - Load filter options into bottom sheet content
    - Wire "Sort" button to open bottom sheet
    - Load sort options into bottom sheet content
    - _Requirements: 5.2, 5.3_

- [ ] 9. Implement swipeable list items
  - [ ] 9.1 Create swipeable item component
    - Build HTML structure with content and actions
    - Style swipeable container and actions
    - Position delete button behind content
    - _Requirements: 5.8, 6.3, 10.4_
  
  - [ ] 9.2 Implement swipe gesture handling
    - Add touch event listeners (touchstart, touchmove, touchend)
    - Calculate swipe distance and direction
    - Apply transform to reveal actions
    - Add snap-back animation
    - _Requirements: 5.8, 6.3, 6.4, 10.4_
  
  - [ ] 9.3 Add delete functionality
    - Implement delete button click handler
    - Add item removal animation
    - Update cart/list state after deletion
    - _Requirements: 6.4_
  
  - [ ]* 9.4 Write property tests for swipeable items
    - **Property 12: Product Card Swipe Actions**
    - **Property 15: Cart Item Swipe to Delete**
    - **Property 29: Swipe Gesture Status Changes**
    - **Validates: Requirements 5.8, 6.3, 6.4, 10.4, 10.5**

- [ ] 10. Adapt cart page for mobile
  - [ ] 10.1 Create mobile cart layout
    - Convert cart items to single column
    - Style quantity buttons to 44x44px minimum
    - Add proper spacing between buttons (8px minimum)
    - _Requirements: 6.1, 6.2, 6.7_
  
  - [ ] 10.2 Implement sticky cart total
    - Position cart total block fixed at bottom
    - Style full-width checkout button
    - Ensure proper z-index above content
    - Add padding to content to prevent overlap
    - _Requirements: 6.5, 6.6_
  
  - [ ] 10.3 Apply swipeable component to cart items
    - Integrate swipeable item component
    - Connect delete action to cart removal
    - Update cart total after deletion
    - _Requirements: 6.3, 6.4_
  
  - [ ]* 10.4 Write property tests for cart
    - **Property 13: Cart Single Column Layout**
    - **Property 14: Touch Target Minimum Size**
    - **Property 16: Interactive Element Spacing**
    - **Validates: Requirements 6.1, 6.2, 6.5, 6.7, 10.1, 10.2**

- [ ] 11. Checkpoint - Verify catalog and cart functionality
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Adapt product details page for mobile
  - [ ] 12.1 Implement full-width product image
    - Set image width to 100% on mobile
    - Add pinch-to-zoom gesture support
    - Implement zoom state management
    - _Requirements: 7.1, 7.2_
  
  - [ ] 12.2 Create accordion component
    - Build accordion HTML structure
    - Style accordion headers and content
    - Add chevron icon rotation animation
    - _Requirements: 7.3_
  
  - [ ] 12.3 Implement accordion JavaScript
    - Add click handlers for accordion headers
    - Implement expand/collapse animation
    - Add max-height transition
    - Optional: Close other accordions when one opens
    - _Requirements: 7.4_
  
  - [ ] 12.4 Convert characteristics to list
    - Transform table layout to vertical list
    - Style characteristic items
    - Ensure proper spacing on mobile
    - _Requirements: 7.5_
  
  - [ ] 12.5 Style sticky Add to Cart button
    - Position button fixed at bottom
    - Set minimum height to 44px
    - Style as full-width primary button
    - Add proper z-index
    - _Requirements: 7.6, 7.7_
  
  - [ ]* 12.6 Write property tests for product details
    - **Property 17: Product Image Full Width**
    - **Property 18: Product Details Accordion**
    - **Property 19: Product Characteristics List Layout**
    - **Property 20: Add to Cart Button Positioning**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7**

- [ ] 13. Adapt orders page for mobile
  - [ ] 13.1 Convert orders table to cards
    - Create order card component
    - Display order number, date, status, total
    - Style status badges with appropriate colors
    - Arrange in single column layout
    - _Requirements: 8.1, 8.2, 8.4_
  
  - [ ] 13.2 Implement order card navigation
    - Add click handler to navigate to order details
    - Add touch feedback on tap
    - _Requirements: 8.3_
  
  - [ ] 13.3 Create mobile order details layout
    - Convert order details to vertical layout
    - Stack all information sections
    - Apply mobile spacing
    - _Requirements: 8.6_
  
  - [ ]* 13.4 Write property tests for orders
    - **Property 21: Orders Card Layout**
    - **Property 22: Order Card Navigation**
    - **Property 23: Order Status Badge Colors**
    - **Property 24: Order Details Vertical Layout**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.6**

- [ ] 14. Adapt profile page for mobile
  - [ ] 14.1 Create mobile form layout
    - Stack form fields vertically
    - Position labels above inputs
    - Set input height to 48px minimum
    - _Requirements: 9.1, 9.2, 9.3_
  
  - [ ] 14.2 Style mobile form buttons
    - Set buttons to full width on mobile
    - Ensure minimum 44px height
    - Add proper spacing between buttons
    - _Requirements: 9.4_
  
  - [ ] 14.3 Add mobile keyboard types
    - Set inputmode="numeric" for number fields
    - Set type="email" for email fields
    - Set type="tel" for phone fields
    - _Requirements: 9.5_
  
  - [ ] 14.4 Implement scroll into view
    - Add focus event listeners to inputs
    - Check if input is obscured by keyboard
    - Scroll input into view if needed
    - _Requirements: 9.6_
  
  - [ ]* 14.5 Write property tests for profile
    - **Property 25: Profile Form Mobile Layout**
    - **Property 26: Form Button Full Width**
    - **Property 27: Mobile Keyboard Types**
    - **Property 28: Input Field Scroll Into View**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6**

- [ ] 15. Implement mobile modal adaptations
  - [ ] 15.1 Create fullscreen modal styles
    - Override modal positioning on mobile
    - Set to fullscreen (top: 0, left: 0, right: 0, bottom: 0)
    - Remove border-radius on mobile
    - Add slide-up animation
    - _Requirements: 11.1_
  
  - [ ] 15.2 Add modal close button
    - Position close button in top-right corner
    - Ensure 44x44px minimum size
    - Style with proper contrast
    - _Requirements: 11.2_
  
  - [ ] 15.3 Implement swipe-to-close
    - Add touch event handlers to modal
    - Detect swipe-down gesture
    - Close modal on valid swipe
    - _Requirements: 11.3_
  
  - [ ] 15.4 Add background scroll lock
    - Set body overflow: hidden when modal opens
    - Restore overflow when modal closes
    - Prevent scroll chaining
    - _Requirements: 11.4, 11.5_
  
  - [ ]* 15.5 Write property tests for modals
    - **Property 31: Modal Fullscreen on Mobile**
    - **Property 32: Modal Swipe to Close**
    - **Property 33: Modal Background Scroll Lock**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**

- [ ] 16. Checkpoint - Verify all page adaptations
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Implement typography and spacing optimizations
  - [ ] 17.1 Add mobile typography styles
    - Reduce heading sizes by 20% on mobile
    - Set base body text to 16px on mobile
    - Set button text to minimum 16px
    - Maintain line-height of 1.5
    - _Requirements: 12.1, 12.2, 12.3, 12.4_
  
  - [ ]* 17.2 Write property tests for typography
    - **Property 34: Mobile Typography Scaling**
    - **Property 35: Button Text Minimum Size**
    - **Validates: Requirements 12.1, 12.4**

- [ ] 18. Implement toast notifications for mobile
  - [ ] 18.1 Create mobile toast positioning
    - Position toasts at bottom on mobile
    - Place above bottom navigation bar
    - Adjust positioning for desktop
    - _Requirements: 14.1, 14.2_
  
  - [ ] 18.2 Add toast stacking
    - Stack multiple toasts vertically
    - Add consistent spacing between toasts
    - _Requirements: 14.4_
  
  - [ ] 18.3 Implement swipe-to-dismiss
    - Add swipe gesture detection to toasts
    - Dismiss toast on swipe left or right
    - Add dismiss animation
    - _Requirements: 14.5_
  
  - [ ]* 18.4 Write property tests for toasts
    - **Property 38: Toast Mobile Positioning**
    - **Property 39: Toast Vertical Stacking**
    - **Property 40: Toast Swipe Dismissal**
    - **Validates: Requirements 14.1, 14.2, 14.4, 14.5**

- [ ] 19. Implement performance optimizations
  - [ ] 19.1 Add image lazy loading
    - Add loading="lazy" attribute to all images
    - Implement Intersection Observer fallback
    - Add placeholder images
    - _Requirements: 15.1, 15.2_
  
  - [ ] 19.2 Implement responsive images
    - Add srcset attributes for different densities
    - Use picture element where appropriate
    - Serve WebP with fallbacks
    - _Requirements: 15.3_
  
  - [ ]* 19.3 Write property tests for image loading
    - **Property 41: Image Lazy Loading**
    - **Property 42: Image Load on Viewport Entry**
    - **Property 43: Responsive Image Sources**
    - **Validates: Requirements 15.1, 15.2, 15.3**

- [ ] 20. Implement table to card conversions
  - [ ] 20.1 Create table-to-card conversion utility
    - Build function to convert table rows to cards
    - Extract column headers as labels
    - Maintain data relationships
    - _Requirements: 16.1, 16.2, 16.3, 16.4_
  
  - [ ] 20.2 Apply consistent card styling
    - Create card component styles
    - Apply to all converted tables
    - Ensure consistent padding, borders, shadows
    - _Requirements: 16.5_
  
  - [ ]* 20.3 Write property tests for table conversion
    - **Property 44: Table to Card Conversion**
    - **Property 45: Card Label Preservation**
    - **Property 46: Consistent Card Styling**
    - **Validates: Requirements 16.1, 16.2, 16.3, 16.4, 16.5**

- [ ] 21. Implement touch interaction enhancements
  - [ ] 21.1 Add double-tap zoom prevention
    - Add touch-action: manipulation to interactive elements
    - Prevent default on double-tap events
    - _Requirements: 10.6_
  
  - [ ] 21.2 Verify all touch targets
    - Audit all interactive elements
    - Ensure 44x44px minimum size
    - Ensure 8px minimum spacing
    - _Requirements: 10.1, 10.2_
  
  - [ ]* 21.3 Write property test for touch interactions
    - **Property 30: Double-Tap Zoom Prevention**
    - **Validates: Requirements 10.6**

- [ ] 22. Implement accessibility enhancements
  - [ ] 22.1 Add ARIA labels for mobile navigation
    - Add aria-label to bottom nav items
    - Add aria-current for active section
    - Add aria-live for cart badge updates
    - _Requirements: 2.2, 2.7_
  
  - [ ] 22.2 Ensure color contrast compliance
    - Audit all text/background combinations
    - Ensure 4.5:1 ratio for normal text
    - Ensure 3:1 ratio for large text
    - Fix any failing combinations
    - _Requirements: 12.5_
  
  - [ ]* 22.3 Write property test for contrast
    - **Property 36: Text Contrast Compliance**
    - **Validates: Requirements 12.5**

- [ ] 23. Add error handling and fallbacks
  - [ ] 23.1 Implement viewport detection fallbacks
    - Add fallback for window.innerWidth
    - Provide default breakpoint if detection fails
    - Log warnings for debugging
    - _Design: Error Handling - Viewport Detection_
  
  - [ ] 23.2 Add touch event fallbacks
    - Detect touch support
    - Fall back to mouse events if needed
    - Provide alternative interactions
    - _Design: Error Handling - Touch Events_
  
  - [ ] 23.3 Implement image loading error handling
    - Add onerror handlers to images
    - Display placeholder on failure
    - Implement retry logic (max 3 attempts)
    - _Design: Error Handling - Image Loading_
  
  - [ ] 23.4 Add Intersection Observer fallback
    - Detect Intersection Observer support
    - Fall back to loading="lazy" attribute
    - Load all images immediately as last resort
    - _Design: Error Handling - Intersection Observer_
  
  - [ ] 23.5 Implement storage fallbacks
    - Wrap localStorage calls in try-catch
    - Fall back to sessionStorage
    - Use in-memory Map as last resort
    - _Design: Error Handling - Local Storage_

- [ ] 24. Final checkpoint and integration testing
  - [ ] 24.1 Run full test suite
    - Execute all property-based tests
    - Execute all unit tests
    - Verify 100% pass rate
  
  - [ ] 24.2 Cross-browser testing
    - Test on Chrome, Firefox, Safari, Edge
    - Test on iOS Safari and Chrome Mobile
    - Verify all features work across browsers
  
  - [ ] 24.3 Manual testing on real devices
    - Test on iPhone (various sizes)
    - Test on Android devices (various sizes)
    - Test all touch gestures
    - Test all page transitions
  
  - [ ] 24.4 Performance audit
    - Run Lighthouse on mobile
    - Verify Core Web Vitals meet targets
    - Optimize any failing metrics
  
  - [ ] 24.5 Accessibility audit
    - Run axe-core automated tests
    - Test with screen reader
    - Test keyboard navigation
    - Fix any issues found

- [ ] 25. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout implementation
- Property tests validate universal correctness properties using fast-check library
- Unit tests validate specific examples and edge cases
- Implementation preserves existing desktop functionality while adding mobile enhancements
- Focus is on Customer role first; patterns can be extended to Manager and Admin roles later
