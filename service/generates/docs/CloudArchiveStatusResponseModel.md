# CloudArchiveStatusResponseModel


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**JobId** | **string** |  | [default to undefined]
**Kind** | **string** |  | [default to undefined]
**Status** | **string** | Current BullMQ job state | [default to undefined]
**EntriesProcessed** | **number** |  | [optional] [default to undefined]
**TotalEntries** | **number** |  | [optional] [default to undefined]
**Percentage** | **number** | Computed completion percentage (0-100) | [optional] [default to undefined]
**OutputKey** | **string** | Output archive key (create jobs only) | [optional] [default to undefined]
**Error** | **string** |  | [optional] [default to undefined]

## Example

```typescript
import { CloudArchiveStatusResponseModel } from './api';

const instance: CloudArchiveStatusResponseModel = {
    JobId,
    Kind,
    Status,
    EntriesProcessed,
    TotalEntries,
    Percentage,
    OutputKey,
    Error,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
