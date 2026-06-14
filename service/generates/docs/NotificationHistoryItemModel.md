# NotificationHistoryItemModel


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**Id** | **string** |  | [default to undefined]
**Type** | [**NotificationType**](NotificationType.md) |  | [default to undefined]
**Title** | **string** |  | [default to undefined]
**Message** | **string** |  | [default to undefined]
**Data** | **object** |  | [optional] [default to undefined]
**IsRead** | **boolean** |  | [default to undefined]
**CreatedAt** | **string** | ISO timestamp the notification was created | [default to undefined]
**ReadAt** | **string** | ISO timestamp it was read | [optional] [default to undefined]

## Example

```typescript
import { NotificationHistoryItemModel } from './api';

const instance: NotificationHistoryItemModel = {
    Id,
    Type,
    Title,
    Message,
    Data,
    IsRead,
    CreatedAt,
    ReadAt,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
