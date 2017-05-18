class MetricsServerException(Exception):
    """
    This exception class overrides the __str__ method to strip extraneous ' characters that certain exception types like
    to add for reasons completely unknown to me.
    """
    def __str__(self):
        return super().__str__().strip("'")


class NotFoundError(MetricsServerException, KeyError):
    pass


class ConfigurationError(MetricsServerException, KeyError):
    pass
