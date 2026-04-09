CREATE TABLE IF NOT EXISTS "announcements" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"type" text DEFAULT 'general',
	"priority" text DEFAULT 'normal',
	"published_at" timestamp,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true,
	"created_by" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"asset_code" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"brand" text,
	"model" text,
	"serial_number" text,
	"purchase_date" date,
	"purchase_price" numeric,
	"warranty_end_date" date,
	"employee_id" integer,
	"assigned_date" date,
	"returned_date" date,
	"status" text DEFAULT 'available',
	"condition" text DEFAULT 'good',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "assets_asset_code_unique" UNIQUE("asset_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"date" date NOT NULL,
	"check_in" timestamp,
	"check_out" timestamp,
	"work_hours" numeric,
	"overtime" numeric DEFAULT '0',
	"status" text DEFAULT 'present',
	"location" text,
	"check_in_location" text,
	"check_out_location" text,
	"regularization_status" text,
	"regularization_reason" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clearance_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"exit_record_id" integer NOT NULL,
	"department" text NOT NULL,
	"task_name" text NOT NULL,
	"status" text DEFAULT 'pending',
	"completed_by" integer,
	"completed_at" timestamp,
	"remarks" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "departments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"manager_id" integer,
	"parent_department_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"document_type" text NOT NULL,
	"document_name" text NOT NULL,
	"file_url" text,
	"file_path" text,
	"file_size" integer,
	"file_data" text,
	"mime_type" text,
	"uploaded_at" timestamp DEFAULT now(),
	"verified_at" timestamp,
	"status" text DEFAULT 'pending'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "employees" (
	"id" serial PRIMARY KEY NOT NULL,
	"auth_user_id" text,
	"employee_code" text,
	"first_name" text NOT NULL,
	"middle_name" text,
	"last_name" text,
	"email" text NOT NULL,
	"phone" text,
	"alternate_contact_number" text,
	"personal_email" text,
	"date_of_birth" date,
	"actual_date_of_birth" date,
	"gender" text,
	"blood_group" text,
	"marital_status" text,
	"spouse_name" text,
	"date_of_marriage" date,
	"father_name" text,
	"mother_name" text,
	"address" text,
	"permanent_address" text,
	"city" text,
	"state" text,
	"country" text,
	"pincode" text,
	"location" text,
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	"emergency_contact_relation" text,
	"emergency_contact1_name" text,
	"emergency_contact1_phone" text,
	"emergency_contact1_relation" text,
	"emergency_contact2_name" text,
	"emergency_contact2_phone" text,
	"emergency_contact2_relation" text,
	"department_id" integer,
	"designation" text,
	"hod_id" integer,
	"reporting_manager_id" integer,
	"employment_type" text DEFAULT 'permanent',
	"position_type" text,
	"replaced_employee_name" text,
	"employment_status" text DEFAULT 'probation',
	"join_date" date NOT NULL,
	"confirmation_date" date,
	"probation_end_date" date,
	"status" text DEFAULT 'active',
	"bgv_status" text,
	"highest_qualification" text,
	"specialization" text,
	"institute_name" text,
	"qualification_score" text,
	"second_highest_qualification" text,
	"second_specialization" text,
	"second_institute_name" text,
	"second_qualification_score" text,
	"vice_president_id" integer,
	"entity" text,
	"bank_name" text,
	"branch_name" text,
	"bank_account_number" text,
	"ifsc_code" text,
	"pan_number" text,
	"aadhar_number" text,
	"pf_status" text,
	"pf_number" text,
	"esi_number" text,
	"uan_number" text,
	"sourcing_channel" text,
	"sourcing_name" text,
	"project_id" integer,
	"ctc" numeric,
	"retention_bonus" numeric,
	"notice_buyout" numeric,
	"salary_structure_id" integer,
	"profile_image_url" text,
	"health_insurance_provider" text,
	"health_insurance_policy_number" text,
	"health_insurance_sum_insured" text,
	"health_insurance_start_date" date,
	"health_insurance_end_date" date,
	"life_insurance_provider" text,
	"life_insurance_policy_number" text,
	"life_insurance_sum_insured" text,
	"life_insurance_nominee_name" text,
	"life_insurance_nominee_relation" text,
	"personal_accident_provider" text,
	"personal_accident_policy_number" text,
	"personal_accident_sum_insured" text,
	"access_role" text DEFAULT 'employee',
	"onboarding_status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "employees_employee_code_unique" UNIQUE("employee_code"),
	CONSTRAINT "employees_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "exit_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"exit_type" text NOT NULL,
	"resignation_date" date,
	"last_working_date" date,
	"notice_period_days" integer DEFAULT 30,
	"reason" text,
	"exit_interview_done" boolean DEFAULT false,
	"exit_interview_notes" text,
	"clearance_status" text DEFAULT 'pending',
	"fnf_status" text DEFAULT 'pending',
	"fnf_amount" numeric,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"category" text NOT NULL,
	"amount" numeric NOT NULL,
	"currency" text DEFAULT 'INR',
	"expense_date" date NOT NULL,
	"description" text,
	"receipt_url" text,
	"status" text DEFAULT 'pending',
	"approved_by" integer,
	"approved_at" timestamp,
	"reimbursed_at" timestamp,
	"remarks" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "generated_letters" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"template_id" integer,
	"letter_type" text NOT NULL,
	"content" text NOT NULL,
	"generated_at" timestamp DEFAULT now(),
	"generated_by" integer,
	"status" text DEFAULT 'draft',
	"sent_at" timestamp,
	"signed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "holidays" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"date" date NOT NULL,
	"type" text DEFAULT 'public',
	"description" text,
	"year" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "leave_balances" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"leave_type_id" integer NOT NULL,
	"year" integer NOT NULL,
	"opening" numeric DEFAULT '0',
	"accrued" numeric DEFAULT '0',
	"used" numeric DEFAULT '0',
	"balance" numeric DEFAULT '0'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "leave_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"leave_type_id" integer,
	"leave_type" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"days" numeric DEFAULT '1',
	"reason" text,
	"status" text DEFAULT 'pending',
	"approved_by" integer,
	"approved_at" timestamp,
	"remarks" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "leave_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"annual_allowance" integer DEFAULT 12,
	"carry_forward" boolean DEFAULT false,
	"max_carry_forward" integer DEFAULT 0,
	"is_paid" boolean DEFAULT true,
	"description" text,
	CONSTRAINT "leave_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "letter_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"subject" text,
	"content" text NOT NULL,
	"placeholders" text,
	"status" text DEFAULT 'active',
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "offer_letters" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"designation" text NOT NULL,
	"department" text,
	"salary" numeric,
	"joining_date" date NOT NULL,
	"reporting_manager" text,
	"work_location" text,
	"content" text,
	"status" text DEFAULT 'draft',
	"sent_at" timestamp,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "onboarding_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"document_type" text NOT NULL,
	"document_name" text NOT NULL,
	"file_name" text,
	"file_data" text,
	"file_size" integer,
	"mime_type" text,
	"status" text DEFAULT 'pending',
	"verified_by" integer,
	"verified_at" timestamp,
	"remarks" text,
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "onboarding_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"task_name" text NOT NULL,
	"category" text DEFAULT 'general',
	"status" text DEFAULT 'pending',
	"due_date" date,
	"completed_at" timestamp,
	"assigned_to" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "onboarding_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"token" text NOT NULL,
	"email" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "onboarding_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payroll" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"month" text NOT NULL,
	"year" integer,
	"basic_salary" numeric NOT NULL,
	"hra" numeric DEFAULT '0',
	"conveyance" numeric DEFAULT '0',
	"da" numeric DEFAULT '0',
	"communication_allowance" numeric DEFAULT '0',
	"medical_allowance" numeric DEFAULT '0',
	"variable_pay" numeric DEFAULT '0',
	"high_altitude_allowance" numeric DEFAULT '0',
	"arrear" numeric DEFAULT '0',
	"bonus" numeric DEFAULT '0',
	"other_earnings" numeric DEFAULT '0',
	"special_allowance" numeric DEFAULT '0',
	"other_allowances" numeric DEFAULT '0',
	"allowances" numeric DEFAULT '0',
	"earnings_remarks" text,
	"insurance_premium" numeric DEFAULT '0',
	"tds" numeric DEFAULT '0',
	"advance" numeric DEFAULT '0',
	"epf" numeric DEFAULT '0',
	"pf" numeric DEFAULT '0',
	"esi" numeric DEFAULT '0',
	"professional_tax" numeric DEFAULT '0',
	"income_tax" numeric DEFAULT '0',
	"other_deductions" numeric DEFAULT '0',
	"deductions" numeric DEFAULT '0',
	"deductions_remarks" text,
	"lop_deduction" numeric DEFAULT '0',
	"gross_salary" numeric DEFAULT '0',
	"net_salary" numeric NOT NULL,
	"ctc" numeric DEFAULT '0',
	"total_days" integer,
	"lop" integer DEFAULT 0,
	"working_days" integer,
	"salary_structure_id" integer,
	"mode_of_payment" text DEFAULT 'Account Transfer',
	"status" text DEFAULT 'draft',
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"client_name" text,
	"budget" numeric DEFAULT '0',
	"revenue" numeric DEFAULT '0',
	"start_date" date,
	"end_date" date,
	"status" text DEFAULT 'active',
	"manager_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "projects_project_code_unique" UNIQUE("project_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "salary_structures" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"basic_percent" numeric NOT NULL,
	"hra_percent" numeric NOT NULL,
	"conveyance_percent" numeric NOT NULL,
	"da_percent" numeric NOT NULL,
	"communication_percent" numeric NOT NULL,
	"medical_percent" numeric NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shifts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"grace_minutes" integer DEFAULT 15,
	"working_hours" numeric DEFAULT '8',
	"is_default" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"password" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"reset_token" varchar,
	"reset_token_expiry" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "assets" ADD CONSTRAINT "assets_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "clearance_tasks" ADD CONSTRAINT "clearance_tasks_exit_record_id_exit_records_id_fk" FOREIGN KEY ("exit_record_id") REFERENCES "public"."exit_records"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "documents" ADD CONSTRAINT "documents_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "exit_records" ADD CONSTRAINT "exit_records_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "generated_letters" ADD CONSTRAINT "generated_letters_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "generated_letters" ADD CONSTRAINT "generated_letters_template_id_letter_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."letter_templates"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_leave_type_id_leave_types_id_fk" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_leave_type_id_leave_types_id_fk" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "offer_letters" ADD CONSTRAINT "offer_letters_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "onboarding_documents" ADD CONSTRAINT "onboarding_documents_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "onboarding_tasks" ADD CONSTRAINT "onboarding_tasks_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "onboarding_tokens" ADD CONSTRAINT "onboarding_tokens_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "payroll" ADD CONSTRAINT "payroll_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" USING btree ("expire");