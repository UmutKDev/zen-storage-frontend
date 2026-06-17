# DirectoryCreateStatusResponseModel


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**JobId** | **string** |  | [default to undefined]
**Status** | **string** | Current BullMQ job state | [default to undefined]
**Percentage** | **number** | Computed completion percentage (0-100) | [optional] [default to undefined]
**Path** | **string** | Resolved directory path | [optional] [default to undefined]
**Error** | **string** |  | [optional] [default to undefined]

## Example

```typescript
import { DirectoryCreateStatusResponseModel } from './api';

const instance: DirectoryCreateStatusResponseModel = {
    JobId,
    Status,
    Percentage,
    Path,
    Error,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
