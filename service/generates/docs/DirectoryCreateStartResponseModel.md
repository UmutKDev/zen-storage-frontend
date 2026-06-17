# DirectoryCreateStartResponseModel


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**JobId** | **string** | BullMQ job id. Empty string when the create was a no-op (SKIP onto an existing folder) — nothing was enqueued. | [default to undefined]
**Path** | **string** | Resolved directory path the worker will create | [default to undefined]

## Example

```typescript
import { DirectoryCreateStartResponseModel } from './api';

const instance: DirectoryCreateStartResponseModel = {
    JobId,
    Path,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
