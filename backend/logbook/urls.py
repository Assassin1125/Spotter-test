from django.urls import path
from .views import CalculateTripView

urlpatterns = [
    path('calculate/', CalculateTripView.as_view(), name='calculate_trip'),
]
