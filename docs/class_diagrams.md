# Class diagrams — domain model

This document sketches the core domain classes and relationships using Mermaid UML.

```mermaid
classDiagram
    class BaseModel {
        <<mixin>>
        +int id
        +datetime created_at
        +datetime updated_at
        +save(session)
        +delete(session)
        +to_dict()
    }

    class User {
        +string username
        +string email
        +string password_hash
        +string role
        +dict profile_data
        +set_password(password)
        +verify_password(password)
        +has_permission(permission)
        +get_orders()
    }

    class Product {
        +string name
        +string description
        +float price
        +int inventory
        +bool is_available()
        +update_inventory(delta)
        +calculate_discount(percent)
    }

    class Order {
        +int user_id
        +list items
        +float total_amount
        +status
        +calculate_total()
        +update_status(status)
        +can_cancel()
    }

    BaseModel <|-- User
    BaseModel <|-- Product
    BaseModel <|-- Order

    Product "*" -- "*" Order : "through OrderItem"
    User "1" -- "*" Order : "user orders"
```

Notes: OrderItem and other helpers are either entities or value objects depending on your design: in this project we keep `OrderItem` as a simple model referencing `Product` and the `Order` aggregate.
