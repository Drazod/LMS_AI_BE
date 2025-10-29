# Payment Completion - Course Enrollment Implementation

## Overview
Implemented complete payment flow that enrolls students in courses after successful VNPay payment, matching the Java version functionality.

## Problem
When payment was completed via VNPay callback, students were not being enrolled in the purchased courses. The `completeOrder` method had TODO comments and didn't create enrollment records.

## Solution - New Components

### 1. EnrollmentEntity (`src/models/entities/EnrollmentEntity.ts`)
TypeORM entity for the `enrollments` table:
- `enrollmentId`: Primary key
- `studentId`: Foreign key to users
- `courseId`: Foreign key to course
- `enrollmentDate`: When enrolled (auto-set)
- `isComplete`: Course completion status (default: false)
- `currentSectionPosition`: Current progress (default: 1)
- `completionDate`: When course was completed (nullable)

### 2. OrderEntity & OrderItemsEntity
- `OrderEntity`: Stores order records (order_id, student_id, payment_date, total_price)
- `OrderItemsEntity`: Stores purchased courses per order (composite key: order_id + course_id)

### 3. EnrollmentService (`src/services/EnrollmentService.ts`)
Service for managing course enrollments:
- `addStudentToCourse(studentId, courseId)`: Enroll single student
- `addStudentToCourses(studentId, courseIds)`: Enroll in multiple courses
- `getStudentEnrollments(studentId)`: Get all student's enrollments
- `getCourseEnrollments(courseId)`: Get all enrollments for a course
- `isStudentEnrolled(studentId, courseId)`: Check enrollment status
- `updateEnrollmentCompletion(...)`: Mark course as complete
- `updateSectionPosition(...)`: Update progress

### 4. Updated OrderService.completeOrder()
Complete implementation matching Java version:

**Payment Verification:**
```typescript
// Verify VNPay secure hash
const hashData = VNPayUtil.getPaymentURL(new Map(Object.entries(paymentParams)), false);
const vnpSecureHash = VNPayUtil.hmacSHA512(VNPayConfigService.getSecretKey(), hashData);
if (vnpSecureHash !== vnp_SecureHash) {
  throw new Error('vnp_SecureHash is invalid');
}
```

**Order Info Parsing:**
Format: `"userId##courseId1#courseId2#courseId3##discountId"`
- Split by `##` to get [userId, courseIds, discountId]
- Split courseIds by `#` to get individual course IDs

**Transaction Flow:**
1. Verify payment signature
2. Parse order info (userId, courseIds, discountId)
3. Create order record in `orders` table
4. For each purchased course:
   - Check if already enrolled (skip if yes)
   - Create order item in `order_items` table
   - Create enrollment in `enrollments` table
   - Remove course from cart
5. Delete used discount (if applicable)
6. Commit transaction or rollback on error

### 5. OrderService.copyCartToOrder() (Private Method)
Implements the core enrollment logic in a database transaction:

```typescript
// Get cart and cart items
// Create order record
// For each cart item in purchase list:
//   - Skip if already enrolled
//   - Create order item
//   - Create enrollment (enrolled, not complete, section 1)
//   - Add to delete list
// Delete purchased items from cart
// Commit or rollback
```

### 6. OrderService.deleteDiscountFromStudent() (Private Method)
Removes discount from student_discount junction table after use.

## Database Migrations

### Migration 1: Enrollments Table (`20251030_create_enrollments_table.sql`)
```sql
CREATE TABLE enrollments (
  enrollment_id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL,
  course_id BIGINT NOT NULL,
  enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_complete BOOLEAN DEFAULT false,
  current_section_position BIGINT DEFAULT 1,
  completion_date TIMESTAMP,
  UNIQUE(student_id, course_id)
);
```

### Migration 2: Orders Tables (`20251030_create_orders_tables.sql`)
```sql
CREATE TABLE orders (
  order_id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL,
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_price BIGINT NOT NULL
);

CREATE TABLE order_items (
  order_id BIGINT NOT NULL,
  course_id BIGINT NOT NULL,
  price BIGINT NOT NULL,
  PRIMARY KEY (order_id, course_id)
);
```

## Complete Payment Flow

### 1. User Initiates Purchase
```
POST /api/orders/processingPurchase
Body: {
  idUser: 123,
  checkoutReq: {
    idCart: 456,
    idCourses: [1, 2, 3],
    idDiscount: 789 (optional)
  },
  prices: { totalPrice, discountPrice, finalPrice }
}
```

### 2. Generate VNPay Payment URL
- OrderService validates prices match checkout
- Creates orderInfo string: "123##1#2#3##789"
- PaymentService generates VNPay payment URL
- Returns payment URL to frontend

### 3. User Completes Payment on VNPay
User is redirected to VNPay, completes payment

### 4. VNPay Callback
```
GET /api/payment/vnpay-callback?vnp_Amount=...&vnp_OrderInfo=123##1#2#3##789&vnp_SecureHash=...
```

### 5. OrderService.completeOrder() Executes
- Verify secure hash ✓
- Parse order info ✓
- Create order record ✓
- Create order items ✓
- Create enrollments ✓
- Remove from cart ✓
- Delete used discount ✓
- Commit transaction ✓

### 6. User Now Has Access to Courses
Student can now:
- View enrolled courses
- Access course content
- Track progress (currentSectionPosition)
- Earn certificate upon completion

## Comparison with Java Version

| Feature | Java Implementation | TypeScript Implementation | Status |
|---------|-------------------|-------------------------|--------|
| Payment verification | ✓ hmacSHA512 | ✓ hmacSHA512 | ✓ Match |
| Order creation | ✓ Order entity | ✓ OrderEntity + raw SQL | ✓ Match |
| Order items | ✓ OrderItems entity | ✓ OrderItemsEntity + raw SQL | ✓ Match |
| Enrollment creation | ✓ StudentService.addStudentToCourse | ✓ Raw SQL insert | ✓ Match |
| Duplicate check | ✓ Check existing enrollment | ✓ Check existing enrollment | ✓ Match |
| Cart cleanup | ✓ Delete cart items | ✓ Delete cart items | ✓ Match |
| Discount deletion | ✓ discountService.deleteDiscountFromStudent | ✓ Raw SQL delete | ✓ Match |
| Transaction safety | ✓ @Transactional | ✓ QueryRunner transaction | ✓ Match |

## Error Handling

### Transaction Rollback
If any step fails during `copyCartToOrder`:
- All database changes are rolled back
- Error is logged with context
- Error is thrown to caller

### Non-Critical Errors
Discount deletion errors are caught and logged but don't fail the order.

### Duplicate Enrollment
If student already enrolled in a course:
- Log warning
- Skip enrollment creation
- Continue with other courses

## Testing Checklist

- [ ] Complete payment flow end-to-end
- [ ] Verify enrollment record created
- [ ] Verify order record created
- [ ] Verify order items created
- [ ] Verify cart items removed
- [ ] Verify discount deleted (if used)
- [ ] Test duplicate enrollment prevention
- [ ] Test transaction rollback on error
- [ ] Test with multiple courses
- [ ] Test with and without discount

## API Usage Example

```typescript
// After VNPay redirects to callback URL
const paymentParams = {
  vnp_Amount: '5000000', // 50,000 VND * 100
  vnp_OrderInfo: '123##1#2#3##789',
  vnp_SecureHash: 'abc123...',
  // ... other VNPay params
};

await orderService.completeOrder(paymentParams);
// Result: Student 123 is now enrolled in courses 1, 2, 3
```

## Environment Variables Required

```bash
VNPAY_TMN_CODE=your_vnpay_code
VNPAY_HASH_SECRET=your_secret_key
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=https://your-frontend.com/payment/callback
```

## Next Steps

1. **Test the complete flow:**
   - Create test orders with real/sandbox VNPay
   - Verify enrollments are created
   - Check cart is cleared

2. **Add enrollment endpoints:**
   - GET /api/students/:studentId/enrollments
   - GET /api/courses/:courseId/enrollments
   - PATCH /api/enrollments/:enrollmentId/progress

3. **Add certificate generation:**
   - Trigger when isComplete = true
   - Generate PDF certificate
   - Send email notification

4. **Add analytics:**
   - Track enrollment rates
   - Monitor cart-to-purchase conversion
   - Track course completion rates

## Related Files

- `src/models/entities/EnrollmentEntity.ts`
- `src/models/entities/OrderEntity.ts`
- `src/models/entities/OrderItemsEntity.ts`
- `src/services/EnrollmentService.ts`
- `src/services/OrderService.ts`
- `src/utils/logger.ts` (used for logging)
- `migrations/20251030_create_enrollments_table.sql`
- `migrations/20251030_create_orders_tables.sql`
