# 📋 Code Standards - GreenGrow

## 📑 Mục Lục

1. [Introduction](#1-introduction)
   1.1 [Purpose](#11-purpose)
   1.2 [Scope](#12-scope)
2. [Code Style Guidelines](#2-code-style-guidelines)
   2.1 [Variables](#21-variables)
   2.2 [Spaces Around Operators](#22-spaces-around-operators)
   2.3 [Statement Rules](#23-statement-rules)
   2.4 [Object Rules](#24-object-rules)
   2.5 [Line Length](#25-line-length)
   2.6 [Spaces](#26-spaces)
   2.8 [Comparative Math](#28-comparative-math)
   2.9 [Dot Location](#29-dot-location)
   2.10 [Array](#210-array)
   2.11 [Modules](#211-modules)
   2.12 [Functions](#212-functions)
   2.13 [String](#213-string)
   2.14 [Error Catching](#214-error-catching)
   2.15 [Files](#215-files)
   2.16 [Others](#216-others)

---

## 1. Introduction

### 1.1 Purpose

Tài liệu này mô tả các chuẩn code và coding style guidelines được sử dụng trong dự án GreenGrow. Mục đích của tài liệu là:

- **Đảm bảo tính nhất quán**: Tất cả code trong dự án phải tuân theo cùng một bộ quy tắc
- **Cải thiện khả năng đọc**: Code phải dễ đọc và dễ hiểu cho tất cả developers
- **Tăng khả năng bảo trì**: Code được viết theo chuẩn sẽ dễ bảo trì và mở rộng hơn
- **Giảm bugs**: Tuân theo best practices giúp giảm thiểu lỗi và vấn đề tiềm ẩn
- **Tăng tốc độ phát triển**: Developers mới có thể nhanh chóng hiểu và đóng góp vào dự án

### 1.2 Scope

Tài liệu này áp dụng cho:

- **Backend**: Node.js + Express.js + MongoDB (JavaScript ES6+)
- **Frontend**: React + TypeScript + Vite
- **Tất cả các file source code** trong dự án GreenGrow
- **Configuration files** và **scripts**

**Tech Stack:**
- Backend: Node.js 18+, Express.js 5.x, MongoDB, Mongoose
- Frontend: React 19+, TypeScript 5.8+, Vite
- Code Style: ES6 Modules, Functional Programming patterns

---

## 2. Code Style Guidelines

### 2.1 Variables

#### Naming Conventions

**✅ ĐÚNG:**
```javascript
// camelCase cho variables và functions
const userName = 'John Doe';
const isActive = true;
const userCount = 10;
const MAX_RETRIES = 3; // UPPER_SNAKE_CASE cho constants

// TypeScript với type annotations
let userId: string = '123';
let count: number = 0;
let isLoggedIn: boolean = false;
```

**❌ SAI:**
```javascript
// Không sử dụng hungarian notation
const strUserName = 'John'; // ❌
const bIsActive = true; // ❌

// Không sử dụng single letter (trừ loop counters)
const u = getUser(); // ❌
const d = new Date(); // ❌

// Không sử dụng abbreviations không rõ ràng
const usr = getUser(); // ❌
const cnt = 0; // ❌
```

#### Variable Declaration

**✅ ĐÚNG:**
```javascript
// Sử dụng const cho values không thay đổi
const API_BASE_URL = 'https://api.example.com';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Sử dụng let cho values có thể thay đổi
let currentUser = null;
let retryCount = 0;

// Destructuring
const { name, email } = user;
const [first, second] = items;
```

**❌ SAI:**
```javascript
// Không sử dụng var
var userName = 'John'; // ❌

// Không khai báo lại const
const userName = 'John';
const userName = 'Jane'; // ❌ Error

// Không sử dụng let khi có thể dùng const
let API_URL = 'https://api.example.com'; // ❌ Should be const
```

#### TypeScript Variable Types

**✅ ĐÚNG:**
```typescript
// Explicit types khi cần thiết
const userId: string = '123';
const count: number = 0;

// Type inference khi rõ ràng
const userName = 'John'; // TypeScript infers string
const isActive = true; // TypeScript infers boolean

// Union types
let status: 'active' | 'inactive' | 'pending';
let value: string | number;

// Optional và nullable
let email: string | null = null;
let phone?: string; // Optional property
```

**❌ SAI:**
```typescript
// Không sử dụng any
let data: any = {}; // ❌

// Sử dụng unknown thay vì any khi không biết type
let data: unknown = {};

// Không bỏ qua type annotations khi không rõ ràng
function process(data) { // ❌ Missing type
  return data.value;
}
```

---

### 2.2 Spaces Around Operators

**✅ ĐÚNG:**
```javascript
// Spaces xung quanh operators
const sum = a + b;
const product = x * y;
const result = value > 0 ? 'positive' : 'negative';

// Không có space sau unary operators
const negative = -value;
const positive = +value;
const not = !isActive;

// Spaces trong comparisons
if (count > 0 && count < 10) {
  // ...
}

// Spaces trong assignments
const userName = 'John';
let count = 0;
```

**❌ SAI:**
```javascript
// Thiếu spaces
const sum=a+b; // ❌
if(count>0&&count<10){} // ❌

// Thừa spaces sau unary operators
const negative = - value; // ❌
const not = ! isActive; // ❌

// Không có spaces trong ternary
const result=value>0?'positive':'negative'; // ❌
```

#### Arrow Functions

**✅ ĐÚNG:**
```javascript
// Spaces xung quanh arrow
const add = (a, b) => a + b;
const multiply = (x, y) => {
  return x * y;
};

// No spaces trong single parameter
const square = x => x * x;
```

**❌ SAI:**
```javascript
const add=(a,b)=>a+b; // ❌
const square = x=>x*x; // ❌
```

---

### 2.3 Statement Rules

#### Semicolons

**✅ ĐÚNG:**
```javascript
// Luôn sử dụng semicolons
const userName = 'John';
const count = 0;

function getData() {
  return data;
}

// Semicolons sau statements
if (condition) {
  doSomething();
}

for (let i = 0; i < 10; i++) {
  console.log(i);
}
```

**❌ SAI:**
```javascript
// Thiếu semicolons
const userName = 'John' // ❌
const count = 0 // ❌
```

#### If Statements

**✅ ĐÚNG:**
```javascript
// Luôn sử dụng braces, kể cả single statement
if (condition) {
  doSomething();
}

if (condition) {
  doSomething();
} else {
  doOtherThing();
}

// Ternary operator cho simple assignments
const result = condition ? valueA : valueB;
```

**❌ SAI:**
```javascript
// Không bỏ braces
if (condition) doSomething(); // ❌

// Không sử dụng ==
if (value == 0) {} // ❌ Use ===
```

#### Switch Statements

**✅ ĐÚNG:**
```javascript
switch (value) {
  case 'option1':
    doSomething();
    break;
  case 'option2':
    doOtherThing();
    break;
  default:
    handleDefault();
}
```

**❌ SAI:**
```javascript
switch(value) { // ❌ Missing space
case 'option1': // ❌ Missing indentation
doSomething();
// Missing break
```

#### Loops

**✅ ĐÚNG:**
```javascript
// For loop
for (let i = 0; i < items.length; i++) {
  processItem(items[i]);
}

// For...of loop
for (const item of items) {
  processItem(item);
}

// For...in loop (chỉ cho objects)
for (const key in object) {
  if (object.hasOwnProperty(key)) {
    processKey(key, object[key]);
  }
}

// While loop
while (condition) {
  doSomething();
}
```

**❌ SAI:**
```javascript
// Không sử dụng var trong loops
for (var i = 0; i < 10; i++) {} // ❌

// Không bỏ braces
for (let i = 0; i < 10; i++) doSomething(); // ❌
```

---

### 2.4 Object Rules

#### Object Literals

**✅ ĐÚNG:**
```javascript
// Short syntax khi property name = variable name
const userName = 'John';
const user = {
  userName, // Shorthand
  email: 'john@example.com',
  age: 30,
};

// Nested objects
const config = {
  api: {
    baseURL: 'https://api.example.com',
    timeout: 5000,
  },
  auth: {
    token: 'secret',
  },
};

// Method shorthand
const user = {
  name: 'John',
  getName() {
    return this.name;
  },
};
```

**❌ SAI:**
```javascript
// Không trailing comma trong single line
const user = { name: 'John', }; // ❌ (OK in multi-line)

// Không sử dụng reserved words làm keys
const obj = { class: 'test' }; // ❌ Use 'className'
```

#### Object Destructuring

**✅ ĐÚNG:**
```javascript
// Basic destructuring
const { name, email } = user;

// With default values
const { name = 'Anonymous', email } = user;

// Renaming
const { name: userName, email: userEmail } = user;

// Nested destructuring
const { address: { city, zipCode } } = user;

// In function parameters
function processUser({ name, email }) {
  // ...
}
```

**❌ SAI:**
```javascript
// Không destructure undefined
const { name } = undefined; // ❌ Will throw error

// Phải check trước
if (user) {
  const { name } = user;
}
```

#### Object Methods

**✅ ĐÚNG:**
```javascript
// Method shorthand
const user = {
  name: 'John',
  getName() {
    return this.name;
  },
  // Arrow function không nên dùng cho methods
  // getName: () => this.name, // ❌ 'this' sẽ không work
};

// Class methods
class User {
  getName() {
    return this.name;
  }
}
```

---

### 2.5 Line Length

**✅ ĐÚNG:**
```javascript
// Giữ line length dưới 100 characters
const result = await service.methodName(param1, param2, param3);

// Nếu quá dài, break thành multiple lines
const result = await service.methodName(
  param1,
  param2,
  param3,
  param4
);

// Function calls
const user = await authService.getUserProfile(
  userId,
  { includeStats: true }
);

// Long conditions
if (
  user.isActive &&
  user.isVerified &&
  user.role === 'admin'
) {
  // ...
}
```

**❌ SAI:**
```javascript
// Quá dài, khó đọc
const result = await service.methodName(param1, param2, param3, param4, param5, param6); // ❌

// Không break properly
const result = await service.methodName(param1, param2, param3,
  param4, param5); // ❌ Inconsistent indentation
```

**Quy Tắc:**
- Maximum line length: **100 characters**
- Break lines tại logical points (operators, commas)
- Align parameters vertically khi có thể

---

### 2.6 Spaces

#### General Spacing Rules

**✅ ĐÚNG:**
```javascript
// Spaces sau keywords
if (condition) {}
for (let i = 0; i < 10; i++) {}
while (condition) {}
switch (value) {}

// Spaces trong function declarations
function myFunction(param1, param2) {
  // ...
}

// Spaces trong function calls
myFunction(arg1, arg2);

// Spaces trong arrays
const items = [1, 2, 3, 4];

// Spaces trong objects
const user = { name: 'John', email: 'john@example.com' };

// No spaces trong empty constructs
function emptyFunction() {}
const emptyArray = [];
const emptyObject = {};
```

**❌ SAI:**
```javascript
// Thiếu spaces sau keywords
if(condition){} // ❌
for(let i=0;i<10;i++){} // ❌

// Thừa spaces
function myFunction ( param1 , param2 ) {} // ❌
```

#### Indentation

**✅ ĐÚNG:**
```javascript
// 2 spaces cho indentation
function myFunction() {
  if (condition) {
    doSomething();
  }
}

// Nested objects
const config = {
  api: {
    baseURL: 'https://api.example.com',
    timeout: 5000,
  },
};

// Arrays
const items = [
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' },
];
```

**❌ SAI:**
```javascript
// Không sử dụng tabs
function myFunction() {
	if (condition) { // ❌ Tab instead of spaces
		doSomething();
	}
}

// Không sử dụng 4 spaces
function myFunction() {
    if (condition) { // ❌ Should be 2 spaces
        doSomething();
    }
}
```

**Quy Tắc:**
- **2 spaces** cho indentation (không phải tabs)
- Consistent indentation trong toàn bộ file
- Align code blocks properly

---

### 2.8 Comparative Math

**✅ ĐÚNG:**
```javascript
// Luôn sử dụng === và !==
if (value === 0) {}
if (name !== '') {}
if (user === null) {}

// Type checking
if (typeof value === 'string') {}
if (Array.isArray(items)) {}
if (value instanceof Date) {}

// Comparisons với numbers
if (count > 0 && count < 10) {}
if (price >= 100 && price <= 1000) {}

// Null/undefined checks
if (user != null) {} // Checks both null and undefined
if (user !== null && user !== undefined) {} // Explicit
```

**❌ SAI:**
```javascript
// Không sử dụng == và !=
if (value == 0) {} // ❌
if (name != '') {} // ❌

// Type coercion issues
if (0 == '0') {} // ❌ true (unexpected)
if ('' == false) {} // ❌ true (unexpected)

// Loose comparisons
if (value == null) {} // ❌ Use === null or != null
```

**Quy Tắc:**
- ✅ Luôn sử dụng **strict equality** (`===`, `!==`)
- ✅ Sử dụng `== null` hoặc `!= null` để check cả null và undefined
- ✅ Explicit type checking khi cần thiết

---

### 2.9 Dot Location

**✅ ĐÚNG:**
```javascript
// Dot ở cuối line khi break
const user = await userService
  .getUserById(userId)
  .then(user => userService.processUser(user))
  .catch(error => handleError(error));

// Chaining methods
const result = array
  .filter(item => item.active)
  .map(item => item.name)
  .sort();

// Object property access
const city = user
  .address
  .city;
```

**❌ SAI:**
```javascript
// Dot ở đầu line (không nhất quán với project style)
const user = await userService.
  getUserById(userId).
  then(user => userService.processUser(user)); // ❌

// Không break properly
const user = await userService.getUserById(userId).then(user => userService.processUser(user)).catch(error => handleError(error)); // ❌ Too long
```

**Quy Tắc:**
- ✅ Dot ở **cuối line** khi break
- ✅ Mỗi method call trên một line khi chaining
- ✅ Consistent với project style

---

### 2.10 Array

#### Array Literals

**✅ ĐÚNG:**
```javascript
// Simple arrays
const numbers = [1, 2, 3, 4, 5];
const names = ['John', 'Jane', 'Bob'];

// Multi-line arrays
const users = [
  { id: 1, name: 'John' },
  { id: 2, name: 'Jane' },
  { id: 3, name: 'Bob' },
];

// Empty array
const items = [];

// Array với trailing comma
const items = [
  'item1',
  'item2',
  'item3', // Trailing comma OK
];
```

**❌ SAI:**
```javascript
// Không sử dụng Array constructor
const items = new Array(10); // ❌ Use []

// Không trailing comma trong single line
const items = [1, 2, 3,]; // ❌ (OK in multi-line)
```

#### Array Methods

**✅ ĐÚNG:**
```javascript
// map, filter, reduce
const doubled = numbers.map(n => n * 2);
const evens = numbers.filter(n => n % 2 === 0);
const sum = numbers.reduce((acc, n) => acc + n, 0);

// Chaining
const result = users
  .filter(user => user.isActive)
  .map(user => user.name)
  .sort();

// Destructuring
const [first, second, ...rest] = items;
```

**❌ SAI:**
```javascript
// Không mutate original array
const doubled = numbers.map(n => {
  numbers.push(n * 2); // ❌ Mutating original
  return n * 2;
});

// Sử dụng forEach khi cần return value
items.forEach(item => {
  return process(item); // ❌ forEach doesn't return
});
// Use map instead
```

#### Array Spread

**✅ ĐÚNG:**
```javascript
// Spreading arrays
const combined = [...array1, ...array2];
const copied = [...original];

// In function calls
const max = Math.max(...numbers);

// Adding items
const newArray = [...oldArray, newItem];
```

---

### 2.11 Modules

#### ES6 Import/Export

**✅ ĐÚNG:**
```javascript
// Named imports
import { httpSuccess, httpError } from '../common/utils/http.js';
import { authenticate, authorize } from '../common/middleware/auth.js';

// Default import
import express from 'express';
import User from './user.model.js';

// Mixed imports
import express, { Router } from 'express';
import User, { UserSchema } from './user.model.js';

// Namespace import
import * as authService from './auth.service.js';

// Type imports (TypeScript)
import type { UserType } from './types';
import { type UserType } from './types';
```

**❌ SAI:**
```javascript
// Không sử dụng require
const express = require('express'); // ❌

// Không bỏ file extension trong ES modules
import { httpSuccess } from '../common/utils/http'; // ❌ Missing .js

// Không sử dụng default export khi có nhiều exports
export default { // ❌ Prefer named exports
  method1,
  method2,
};
```

#### Export Patterns

**✅ ĐÚNG:**
```javascript
// Named exports (preferred)
export const functionName = () => {};
export const constantName = 'value';

// Default export cho main entity
export default User;

// Export list
export {
  function1,
  function2,
  constant1,
};

// Re-export
export { functionName } from './other-module.js';
```

**❌ SAI:**
```javascript
// Không export default khi có nhiều exports
export default { // ❌
  method1,
  method2,
};

// Không mix default và named exports confusingly
export default User;
export { User }; // ❌ Confusing
```

#### Module Organization

**✅ ĐÚNG:**
```javascript
// Order: External → Internal → Types
import express from 'express';
import mongoose from 'mongoose';

import { httpSuccess } from '../common/utils/http.js';
import User from './user.model.js';

import type { UserType } from './types';
```

---

### 2.12 Functions

#### Function Declarations

**✅ ĐÚNG:**
```javascript
// Named function
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Arrow function
const calculateTotal = (items) => {
  return items.reduce((sum, item) => sum + item.price, 0);
};

// Arrow function với implicit return
const double = (n) => n * 2;

// Async function
async function fetchUser(userId) {
  const user = await userService.getUser(userId);
  return user;
}

// TypeScript với types
function processUser(user: UserType): Promise<ProcessedUser> {
  // ...
}
```

**❌ SAI:**
```javascript
// Không sử dụng function expressions khi có thể dùng declarations
const myFunction = function() {}; // ❌ Use function declaration

// Không bỏ parentheses cho single parameter khi có type
const process = (user: UserType) => {}; // ✅
const process = user: UserType => {}; // ❌

// Không sử dụng arguments object
function sum() {
  return Array.from(arguments).reduce((a, b) => a + b); // ❌
}
// Use rest parameters instead
function sum(...numbers) {
  return numbers.reduce((a, b) => a + b);
}
```

#### Function Parameters

**✅ ĐÚNG:**
```javascript
// Default parameters
function greet(name = 'Guest') {
  return `Hello, ${name}`;
}

// Rest parameters
function sum(...numbers) {
  return numbers.reduce((a, b) => a + b, 0);
}

// Destructuring parameters
function processUser({ name, email, age = 0 }) {
  // ...
}

// TypeScript parameters
function createUser(
  name: string,
  email: string,
  age?: number
): Promise<User> {
  // ...
}
```

**❌ SAI:**
```javascript
// Không mutate parameters
function processUser(user) {
  user.name = user.name.toUpperCase(); // ❌ Mutating parameter
  return user;
}
// Create new object instead
function processUser(user) {
  return {
    ...user,
    name: user.name.toUpperCase(),
  };
}
```

#### Async/Await

**✅ ĐÚNG:**
```javascript
// Async/await (preferred)
async function fetchData() {
  try {
    const result = await api.getData();
    return result;
  } catch (error) {
    throw httpError(500, 'Failed to fetch data');
  }
}

// Multiple awaits
async function processUser(userId) {
  const user = await userService.getUser(userId);
  const profile = await profileService.getProfile(userId);
  return { user, profile };
}

// Parallel awaits
async function fetchAllData() {
  const [users, posts, comments] = await Promise.all([
    userService.getUsers(),
    postService.getPosts(),
    commentService.getComments(),
  ]);
  return { users, posts, comments };
}
```

**❌ SAI:**
```javascript
// Không sử dụng .then() khi có thể dùng async/await
function fetchData() {
  return api.getData()
    .then(result => processResult(result))
    .catch(error => handleError(error)); // ❌ Use async/await
}

// Không await trong loops (sequential)
for (const id of ids) {
  await processItem(id); // ❌ Sequential, slow
}
// Use Promise.all for parallel
await Promise.all(ids.map(id => processItem(id)));
```

---

### 2.13 String

#### String Literals

**✅ ĐÚNG:**
```javascript
// Template literals (preferred)
const message = `Hello, ${userName}`;
const multiline = `
  Line 1
  Line 2
  Line 3
`;

// Single quotes cho simple strings
const name = 'John';

// Double quotes khi có single quote inside
const text = "It's a beautiful day";

// Template literals cho complex strings
const url = `/api/users/${userId}/posts/${postId}`;
```

**❌ SAI:**
```javascript
// Không sử dụng string concatenation
const message = 'Hello, ' + userName; // ❌ Use template literals

// Không escape khi có thể dùng template literals
const message = 'Hello, ' + userName + '!'; // ❌
```

#### String Methods

**✅ ĐÚNG:**
```javascript
// String methods
const upper = name.toUpperCase();
const lower = name.toLowerCase();
const trimmed = text.trim();
const replaced = text.replace(/old/g, 'new');

// Template literal với expressions
const message = `User ${user.name} has ${user.posts.length} posts`;
```

---

### 2.14 Error Catching

#### Try-Catch Blocks

**✅ ĐÚNG:**
```javascript
// Try-catch với specific error handling
try {
  const result = await service.method();
  return result;
} catch (error) {
  if (error.statusCode === 404) {
    throw httpError(404, 'Resource not found');
  }
  throw httpError(500, 'Internal server error');
}

// Error handling trong async functions
async function processData() {
  try {
    const data = await fetchData();
    return processData(data);
  } catch (error) {
    logger.error('Failed to process data', error);
    throw error;
  }
}

// Multiple error types
try {
  await riskyOperation();
} catch (error) {
  if (error instanceof ValidationError) {
    handleValidationError(error);
  } else if (error instanceof NetworkError) {
    handleNetworkError(error);
  } else {
    handleUnknownError(error);
  }
}
```

**❌ SAI:**
```javascript
// Không bỏ qua errors
try {
  await riskyOperation();
} catch (error) {
  // ❌ Silent failure
}

// Không catch và rethrow mà không xử lý
try {
  await operation();
} catch (error) {
  throw error; // ❌ No handling, just remove try-catch
}

// Không sử dụng generic Error
catch (error) {
  throw new Error('Something went wrong'); // ❌ Loses original error info
}
```

#### Error Objects

**✅ ĐÚNG:**
```javascript
// Custom error với httpError utility
throw httpError(400, 'Invalid input data');

// Error với context
const error = httpError(404, 'User not found');
error.userId = userId; // Add context
throw error;

// TypeScript error types
class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

**Quy Tắc:**
- ✅ Luôn handle errors properly
- ✅ Provide meaningful error messages
- ✅ Include context khi có thể
- ✅ Log errors trước khi rethrow
- ✅ Sử dụng httpError utility cho HTTP errors

---

### 2.15 Files

#### File Naming

**✅ ĐÚNG:**
```javascript
// Backend: kebab-case với .js extension
// auth.controller.js
// user.service.js
// post.model.js
// email-verification.routes.js

// Frontend: PascalCase với .tsx/.ts extension
// UserProfile.tsx
// AuthService.ts
// types.ts
```

**❌ SAI:**
```javascript
// Không sử dụng camelCase cho backend files
// authController.js ❌
// userService.js ❌

// Không sử dụng kebab-case cho frontend components
// user-profile.tsx ❌
```

#### File Structure

**✅ ĐÚNG:**
```javascript
// Backend module structure
// modules/featureName/
//   ├── featureName.controller.js
//   ├── featureName.service.js
//   ├── featureName.model.js
//   ├── featureName.routes.js
//   └── README.md

// Frontend component structure
// components/ComponentName/
//   ├── ComponentName.tsx
//   ├── ComponentName.test.tsx
//   └── types.ts
```

#### File Organization

**✅ ĐÚNG:**
```javascript
// Import order trong file
// 1. External dependencies
import express from 'express';
import mongoose from 'mongoose';

// 2. Internal modules
import { httpSuccess } from '../common/utils/http.js';
import User from './user.model.js';

// 3. Types (TypeScript)
import type { UserType } from './types';

// 4. Code
export const functionName = () => {};
```

---

### 2.16 Others

#### Comments

**✅ ĐÚNG:**
```javascript
// Single line comment
const userName = 'John'; // User's display name

/**
 * Multi-line comment với JSDoc
 * @param {string} userId - User ID
 * @returns {Promise<object>} User object
 */
async function getUser(userId) {
  // Implementation
}

// TODO comments
// TODO: Implement caching for this function
// FIXME: This needs optimization
// NOTE: This is a workaround for issue #123
```

**❌ SAI:**
```javascript
// Không comment code đã xóa
// const oldCode = 'removed'; // ❌ Remove completely

// Không comment rõ ràng
// do something // ❌ What does "something" mean?
```

#### Constants

**✅ ĐÚNG:**
```javascript
// UPPER_SNAKE_CASE cho constants
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = 'https://api.example.com';
const DEFAULT_TIMEOUT = 5000;

// Constants object
const CONFIG = {
  MAX_RETRIES: 3,
  TIMEOUT: 5000,
  API_URL: 'https://api.example.com',
};
```

#### TypeScript Specific

**✅ ĐÚNG:**
```typescript
// Type assertions
const element = document.getElementById('app') as HTMLElement;

// Type guards
function isUser(obj: unknown): obj is User {
  return typeof obj === 'object' &&
         obj !== null &&
         'id' in obj &&
         'name' in obj;
}

// Generics
function identity<T>(arg: T): T {
  return arg;
}
```

#### React Specific

**✅ ĐÚNG:**
```typescript
// Functional components
export const UserProfile = ({ userId }: { userId: string }) => {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);
  
  return <div>{user?.name}</div>;
};

// Custom hooks
export const useUser = (userId: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchUser(userId)
      .then(setUser)
      .finally(() => setLoading(false));
  }, [userId]);
  
  return { user, loading };
};
```

#### Code Formatting

**✅ ĐÚNG:**
```javascript
// Consistent formatting
const user = {
  id: 1,
  name: 'John',
  email: 'john@example.com',
};

// Trailing commas trong multi-line
const items = [
  'item1',
  'item2',
  'item3', // Trailing comma
];
```

---

## 📚 Tài Liệu Tham Khảo

- [JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [TypeScript Style Guide](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [React Best Practices](https://react.dev/learn)

---

**Lưu ý**: Tài liệu này sẽ được cập nhật thường xuyên. Vui lòng tham khảo version mới nhất trước khi bắt đầu coding.
