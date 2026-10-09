Feature: Admin sign in
  As a store administrator
  I want to sign in to the admin panel
  So that only authorized people can manage the store

  Background:
    Given I am on the admin sign in page

  Scenario: Sign in with valid credentials
    When I sign in as "admin@test.com" with password "admin123"
    Then I see the admin dashboard

  Scenario Outline: Sign in is rejected
    When I sign in as "<email>" with password "<password>"
    Then I see the message "<message>"
    And I stay on the sign in page

    Examples:
      | email           | password | message                                     |
      | nobody@test.com | admin123 | Invalid email or password                   |
      | not-an-email    | admin123 | Please enter a valid email address          |
      | admin@test.com  | 12345    | Password must be at least 6 characters long |
      |                 |          | Email is required                           |
