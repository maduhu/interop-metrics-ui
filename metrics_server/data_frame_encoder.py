from flask.json import JSONEncoder
from pandas import DataFrame, Timestamp, to_datetime, notnull


class DataFrameEncoder(JSONEncoder):
    """
    Encodes DataFrames to JSON.

    Normally you'd just use DataFrame.to_json, however, if you want to nest your DataFrame in a larger JSON object you
    cannot do that, and have to implement your own JSON encoder.
    """
    def default(self, obj):
        if isinstance(obj, DataFrame):
            return obj.where(notnull(obj), None).to_dict(orient='split')['data']

        if isinstance(obj, Timestamp):
            return to_datetime(obj).isoformat()

        return JSONEncoder.default(self, obj)
