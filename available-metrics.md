Each interop service publishes a set of service specific metrics at ~5 second interval.  

There are 2 type of metrics.

**Counter** - A metric that represents a count of "something", e.g. user queries, quote requests, queue depth etc.  A counter can be incremented or decremented. A counter metric has 2 properties.

Property | Description
------------ | -------------
Count | Last reported value of count 
Interval Count | Change in count value between reporting intervals 

**Timer** - A metric that represents a timing of a service task.  It also keeps track of how many time the task was measured

Property | Description
------------ | -------------
Count | Last reported value of count 
Interval Count | Change in count value between reporting intervals 
Mean |
Min |
Median |
Max |
Std Dev |
75, 95, 98, 99, 999th Percentiles |
1, 5, 15 minute rates |

Available Metric By Interop Service

1. interop-spsp-clientproxy
* l1p.spsp.query.api.QueryGetTime
* l1p.spsp.query.api.QueryGetProxyTime
* l1p.spsp.quoteDestinationAmount.api.QuoteDestinationAmountGetTime
* l1p.spsp.quoteDestinationAmount.api.QuoteDestinationAmountGetProxyTime
* l1p.spsp.payments.api.PaymentsPutTime
* l1p.spsp.payments.api.PaymentsPutProxyTime		
* l1p.spsp.invoice.api.InvoiceGetTime
* l1p.spsp.invoice.api.InvoiceGetProxyTime

2. interop-ilp-ledger-adapter
* l1p.interop-ilp-ledger.transfers-fulfillment.api.TransfersFulfillmentPutRequestTime
* l1p.interop-ilp-ledger.message.api.ConnectorsPostMessageTime
* l1p.interop-ilp-ledger.transfer.TransferExecuteSuccess
* l1p.interop-ilp-ledger.transfer.TransferExecuteFailure
* l1p.interop-ilp-ledger.transfer.TransferPutSuccess
* l1p.interop-ilp-ledger.accounts-id.api.AccountsIdGetRequestTime
* l1p.interop-ilp-ledger.transfers.api.TransfersPutRequestTime
* l1p.interop-ilp-ledger.metadata.api.MetadataGetTime
* l1p.interop-ilp-ledger.transfers.api.TransfersGetRequestTime
* l1p.interop-ilp-ledger.auth-token.api.AuthTokenGetRequestTime

3. interop-spsp-backend-services
* l1p.spsp-backend.fetch.api.FetchPayeeGetTime
* l1p.spsp-backend.fetch.api.FetchInvoiceGetTime
* l1p.spsp-backend.payments.api.PaymentsInvoicePutTime

4. interop-dfsp-directory
* l1p.dfsp.directory.api.GetResourcesTime
