from django.contrib.auth.models import User
from django.db import models


# class Measurement(models.Model):
#     measurement_id = models.BigAutoField(primary_key=True)
#     user = models.ForeignKey(User, on_delete=models.SET_NULL, related_name='measurement', null=True)
#     angles = models.JSONField(default=[])
#     average_angle = models.FloatField(default=0)
#
#     base_angle = models.FloatField(default=0)
#
#     start_datetime = models.DateTimeField()
#     end_datetime = models.DateTimeField()
