import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Trip',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('start_location', models.CharField(max_length=255)),
                ('pickup_location', models.CharField(max_length=255)),
                ('dropoff_location', models.CharField(max_length=255)),
                ('current_cycle_used', models.FloatField(default=0.0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name='LogSheet',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField()),
                ('image', models.ImageField(upload_to='logs/')),
                ('trip', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='logs', to='logbook.trip')),
            ],
        ),
    ]
