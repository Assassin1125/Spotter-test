from django.db import models

class Trip(models.Model):
    start_location = models.CharField(max_length=255)
    pickup_location = models.CharField(max_length=255)
    dropoff_location = models.CharField(max_length=255)
    current_cycle_used = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)

class LogSheet(models.Model):
    trip = models.ForeignKey(Trip, related_name='logs', on_delete=models.CASCADE)
    date = models.DateField()
    image = models.ImageField(upload_to='logs/')

    def __str__(self):
        return f"Log {self.date} for Trip {self.trip.id}"
