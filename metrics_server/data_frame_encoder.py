from flask.json import JSONEncoder
from pandas import DataFrame, Timestamp, to_datetime, notnull


class DataFrameEncoder(JSONEncoder):
    """
    Encodes DataFrames to JSON.

    Normally you'd just use DataFrame.to_json, however, if you want to nest your DataFrame in a larger JSON object you
    cannot do that, and have to implement your own JSON encoder. Also by implementing our own Encoder we can use the
    to_dict method with 'list' orientation, which gives us an object that looks like this:
        {
          "column_1": [value_1, value_2, ..., value_n],
          ...
          "column_n": [value_1, value_2, ..., value_n]
        }
    """
    def default(self, obj):
        if isinstance(obj, DataFrame):
            # TODO: change orient to 'list' and update front end to handle new format. If we use list orientation the
            # JSON body will be significantly smaller in size.
            return obj.where(notnull(obj), None).to_dict(orient='records')

        if isinstance(obj, Timestamp):
            return to_datetime(obj).isoformat()

        return JSONEncoder.default(self, obj)
