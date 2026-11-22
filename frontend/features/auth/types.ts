export type RegisterStep = 1 | 2 | 3;

export type AccountFormValues = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
};

export type BusinessFormValues = {
  businessName: string;
  businessType: string;
  city: string;
  currency: string;
  timezone: string;
};

export type LoginFormValues = {
  email: string;
  password: string;
  keepSignedIn: boolean;
};
