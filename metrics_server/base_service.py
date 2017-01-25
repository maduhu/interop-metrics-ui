from abc import ABCMeta


class BaseService(metaclass=ABCMeta):
    def __init__(self, config, services):
        self.config = config
        self.services = services
