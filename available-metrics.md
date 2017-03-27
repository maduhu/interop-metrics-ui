Each interop service publishes a set of service specific metrics at ~5 second interval.  

There are 2 type of metrics.

**Counter** - A metric that represents a count of "something", e.g. user queries, quote requests, queue depth etc.  A counter can be incremented or decremented. A counter metric has 2 properties.

Property | Description
------------ | -------------
Count | Last reported value of count 
Interval Count | Change in count value between reporting intervals 

**Timer** - A metric that represents a timing of a set of operations within an interop service.  It also keeps count of how many times the operations duration was measured.  Time measurement is repored in milliseconds.

Property | Description
------------ | -------------
Count | Last reported value of count 
Interval Count | Change in count value between reporting intervals 
Mean, Min, Median, Max, Std Dev, 75, 95, 98, 99, 999th Percentiles | These statistics are based on sampling.  We are using dropwizard-metrics library.  It uses an exponentially-decaying random reservoir of forward-decaying priority reservoir sampling method to produce a statistically representative sampling reservoir, exponentially biased towards newer entries.  It configured to heavily biases the reservoir to the past 5 minutes of measurements.  For mmohttp://dimacs.rutgers.edu/~graham/pubs/papers/fwddecay.pdf.
1, 5, 15 minute rates | Exponentially weighted moving average

Available Metric By Interop Service

#### interop-spsp-clientproxy
  * Timers
    * l1p.spsp.query.api.QueryGetTime
    * l1p.spsp.query.api.QueryGetProxyTime
    * l1p.spsp.quoteDestinationAmount.api.QuoteDestinationAmountGetTime
    * l1p.spsp.quoteDestinationAmount.api.QuoteDestinationAmountGetProxyTime
    * l1p.spsp.payments.api.PaymentsPutTime
    * l1p.spsp.payments.api.PaymentsPutProxyTime		
    * l1p.spsp.invoice.api.InvoiceGetTime
    * l1p.spsp.invoice.api.InvoiceGetProxyTime
    * l1p.spsp.invoice.api.InvoicePostTime
    * l1p.spsp.invoice.api.InvoicePostProxyTime
  * Counters
    * l1p.spsp.api.error.ResourceNotFound
    * l1p.spsp.api.error.MethodNotAllowed
    * l1p.spsp.api.error.UnsupportedMediaType
    * l1p.spsp.api.error.NotAcceptable
    * l1p.spsp.api.error.BadRequest
    * l1p.spsp.api.error.TransformationException

#### interop-ilp-ledger-adapter
  * Timers
    * l1p.interop-ilp-ledger.transfers-fulfillment.api.TransfersFulfillmentPutRequestTime
    * l1p.interop-ilp-ledger.transfers-rejection.api.TransfersRejectionPutRequestTime
    * l1p.interop-ilp-ledger.connectors.api.ConnectorGetRequestTime
    * l1p.interop-ilp-ledger.message.api.ConnectorsPostMessageTime
    * l1p.interop-ilp-ledger.accounts.api.AccountsGetRequestTime
    * l1p.interop-ilp-ledger.accounts-id.api.AccountsIdGetRequestTime
    * l1p.interop-ilp-ledger.accounts-id.api.AccountsIdPutRequestTime
    * l1p.interop-ilp-ledger.transfers.api.TransfersGetRequestTime
    * l1p.interop-ilp-ledger.transfers.api.TransfersPutRequestTime
    * l1p.interop-ilp-ledger.metadata.api.MetadataGetTime
    * l1p.interop-ilp-ledger.health.api.HealthGetRequestTime
    * l1p.interop-ilp-ledger.auth-token.api.AuthTokenGetRequestTime
  * Counters
    * l1p.interop-ilp-ledger.transfer.TransferExecuteSuccess
    * l1p.interop-ilp-ledger.transfer.TransferExecuteFailure
    * l1p.interop-ilp-ledger.transfer.TransferRejectSuccess
    * l1p.interop-ilp-ledger.transfer.TransferRejectFailure
    * l1p.interop-ilp-ledger.transfer.TransferPutSuccess
    * l1p.interop-ilp-ledger.transfer.TransferPutFailure

#### interop-spsp-backend-services
  * Timers
    * l1p.spsp-backend.fetch.api.FetchPayeeGetTime
    * l1p.spsp-backend.fetch.api.FetchInvoiceGetTime
    * l1p.spsp-backend.payments.api.PaymentsInvoicePutTime
    * l1p.spsp-backend.payments.api.PaymentsInvoicePostTime
    * l1p.spsp-backend.payments.api.PaymentsPayeePutTime
  * Counters
    * l1p.spsp-backend.api.error.ResourceNotFound
    * l1p.spsp-backend.api.error.MethodNotAllowed
    * l1p.spsp-backend.api.error.UnsupportedMediaType
    * l1p.spsp-backend.api.error.NotAcceptable
    * l1p.spsp-backend.api.error.BadRequest
    * l1p.spsp-backend.api.error.TransformationException

#### interop-dfsp-directory
  * Timers
    * l1p.dfsp.directory.api.GetResourcesTime
    * l1p.dfsp.directory.api.RegisterDfspTime
    * l1p.dfsp.directory.api.GetIdentifierTypesTime
    * l1p.dfsp.directory.api.GetMetadataTime
