# Generated by Django 4.2.7 on 2023-11-28 19:11

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_alter_appuser_is_active'),
    ]

    operations = [
        migrations.AddField(
            model_name='appuser',
            name='verification_code',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
    ]
