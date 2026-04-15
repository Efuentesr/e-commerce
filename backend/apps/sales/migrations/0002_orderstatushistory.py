import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sales', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='OrderStatusHistory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('from_status', models.CharField(blank=True, max_length=20, null=True)),
                ('to_status', models.CharField(max_length=20)),
                ('changed_at', models.DateTimeField(auto_now_add=True)),
                ('note', models.CharField(max_length=255)),
                ('changed_by', models.ForeignKey(
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='order_history',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('order', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='history',
                    to='sales.order',
                )),
            ],
            options={
                'ordering': ['changed_at'],
            },
        ),
    ]
