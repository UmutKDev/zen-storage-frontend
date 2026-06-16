# CloudArchiveExtractStartRequestModel


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**Key** | **string** | Key of the archive file to extract | [default to undefined]
**SelectedEntries** | **Array&lt;string&gt;** | Specific entry paths to extract (selective extraction). Omit for full extraction. | [optional] [default to undefined]
**Strategy** | **string** | How to handle an existing extract-output folder. Defaults to REPLACE. | [optional] [default to undefined]
**CreateFolder** | **boolean** | When true (default), extract into a new subfolder named after the archive; when false, extract straight into the archive’s folder. | [optional] [default to undefined]

## Example

```typescript
import { CloudArchiveExtractStartRequestModel } from './api';

const instance: CloudArchiveExtractStartRequestModel = {
    Key,
    SelectedEntries,
    Strategy,
    CreateFolder,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
