from django.urls import path
from .views import google_login, profile
# from .views import test_login, profile


urlpatterns = [
    path("auth/google/", google_login),
    path("profile/", profile),
    # path("auth/test/", test_login),

]
