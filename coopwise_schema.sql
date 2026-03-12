--
-- PostgreSQL database dump
--

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: enroll_officer_in_training(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enroll_officer_in_training(p_training_id uuid, p_officer_id uuid) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO training_registrations (training_id, officer_id)
  VALUES (p_training_id, p_officer_id)
  ON CONFLICT (training_id, officer_id) DO NOTHING;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_logs (
    id integer NOT NULL,
    user_id character varying(255),
    user_name character varying(255),
    action character varying(50),
    module character varying(50),
    description text,
    target_id character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: activity_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.activity_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: activity_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.activity_logs_id_seq OWNED BY public.activity_logs.id;


--
-- Name: attendance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    officer_id uuid,
    training_id uuid,
    recorded_at timestamp with time zone DEFAULT now(),
    recorded_by uuid,
    method character varying(50),
    check_in_time time without time zone
);


--
-- Name: companion_registrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.companion_registrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    training_id uuid NOT NULL,
    officer_id uuid NOT NULL,
    companion_name text NOT NULL,
    companion_email text NOT NULL,
    companion_phone text,
    companion_position text,
    registered_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: compliance_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.compliance_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cooperative_id uuid,
    requirement_type character varying(100) NOT NULL,
    requirement_name character varying(255) NOT NULL,
    description text,
    due_date date,
    submitted_date date,
    status character varying(50) DEFAULT 'pending'::character varying,
    documents jsonb DEFAULT '[]'::jsonb,
    reviewer_notes text,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    year integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: cooperatives; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cooperatives (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    coop_id character varying(50),
    name character varying(255) NOT NULL,
    type character varying(100),
    address text,
    city character varying(100),
    province character varying(100),
    region character varying(100),
    registration_number character varying(100),
    cda_registration_date date,
    tin character varying(50),
    contact_person character varying(255),
    contact_email character varying(255),
    contact_phone character varying(50),
    status character varying(50) DEFAULT 'pending'::character varying,
    submitted_documents jsonb DEFAULT '[]'::jsonb,
    review_notes text,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    member_id character varying(50),
    cooperative_id uuid,
    first_name character varying(100) NOT NULL,
    middle_name character varying(100),
    last_name character varying(100) NOT NULL,
    suffix character varying(20),
    date_of_birth date,
    gender character varying(20),
    civil_status character varying(30),
    address text,
    city character varying(100),
    province character varying(100),
    email character varying(255),
    phone character varying(50),
    occupation character varying(100),
    tin character varying(50),
    photo_url text,
    documents jsonb DEFAULT '[]'::jsonb,
    status character varying(50) DEFAULT 'pending'::character varying,
    membership_date date,
    review_notes text,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    role character varying(50) DEFAULT 'Regular Member'::character varying
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    username character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    cooperative character varying(255),
    "position" character varying(255),
    user_id_display character varying(50),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    first_name character varying(100),
    middle_name character varying(100),
    last_name character varying(100),
    email character varying(255),
    password_hash character varying(255)
);


--
-- Name: training_registrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.training_registrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    training_id uuid NOT NULL,
    officer_id uuid NOT NULL,
    registered_at timestamp with time zone DEFAULT now()
);


--
-- Name: training_suggestions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.training_suggestions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    category character varying(100) NOT NULL,
    preferred_date date,
    justification text,
    priority character varying(20) DEFAULT 'medium'::character varying,
    officer_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(50) DEFAULT 'pending'::character varying
);


--
-- Name: trainings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trainings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    training_id character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    topic character varying(255) NOT NULL,
    date date NOT NULL,
    start_date date NOT NULL,
    end_date date,
    "time" time without time zone,
    venue character varying(255) NOT NULL,
    speaker character varying(255) NOT NULL,
    capacity integer NOT NULL,
    status character varying(50) DEFAULT 'upcoming'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    target_positions jsonb DEFAULT '[]'::jsonb
);


--
-- Name: activity_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs ALTER COLUMN id SET DEFAULT nextval('public.activity_logs_id_seq'::regclass);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: attendance attendance_officer_id_training_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_officer_id_training_id_key UNIQUE (officer_id, training_id);


--
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- Name: companion_registrations companion_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companion_registrations
    ADD CONSTRAINT companion_registrations_pkey PRIMARY KEY (id);


--
-- Name: compliance_records compliance_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance_records
    ADD CONSTRAINT compliance_records_pkey PRIMARY KEY (id);


--
-- Name: cooperatives cooperatives_coop_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cooperatives
    ADD CONSTRAINT cooperatives_coop_id_key UNIQUE (coop_id);


--
-- Name: cooperatives cooperatives_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cooperatives
    ADD CONSTRAINT cooperatives_pkey PRIMARY KEY (id);


--
-- Name: members members_member_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_member_id_key UNIQUE (member_id);


--
-- Name: members members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_username_key UNIQUE (username);


--
-- Name: training_registrations training_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_registrations
    ADD CONSTRAINT training_registrations_pkey PRIMARY KEY (id);


--
-- Name: training_registrations training_registrations_training_id_officer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_registrations
    ADD CONSTRAINT training_registrations_training_id_officer_id_key UNIQUE (training_id, officer_id);


--
-- Name: training_suggestions training_suggestions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_suggestions
    ADD CONSTRAINT training_suggestions_pkey PRIMARY KEY (id);


--
-- Name: trainings trainings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainings
    ADD CONSTRAINT trainings_pkey PRIMARY KEY (id);


--
-- Name: trainings trainings_training_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainings
    ADD CONSTRAINT trainings_training_id_key UNIQUE (training_id);


--
-- Name: idx_attendance_officer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attendance_officer_id ON public.attendance USING btree (officer_id);


--
-- Name: idx_attendance_training_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attendance_training_id ON public.attendance USING btree (training_id);


--
-- Name: idx_companion_registrations_officer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_companion_registrations_officer_id ON public.companion_registrations USING btree (officer_id);


--
-- Name: idx_companion_registrations_training_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_companion_registrations_training_id ON public.companion_registrations USING btree (training_id);


--
-- Name: idx_compliance_records_cooperative_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_compliance_records_cooperative_id ON public.compliance_records USING btree (cooperative_id);


--
-- Name: idx_compliance_records_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_compliance_records_due_date ON public.compliance_records USING btree (due_date);


--
-- Name: idx_compliance_records_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_compliance_records_status ON public.compliance_records USING btree (status);


--
-- Name: idx_cooperatives_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cooperatives_name ON public.cooperatives USING btree (name);


--
-- Name: idx_cooperatives_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cooperatives_status ON public.cooperatives USING btree (status);


--
-- Name: idx_members_cooperative_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_members_cooperative_id ON public.members USING btree (cooperative_id);


--
-- Name: idx_members_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_members_status ON public.members USING btree (status);


--
-- Name: idx_training_registrations_officer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_training_registrations_officer_id ON public.training_registrations USING btree (officer_id);


--
-- Name: idx_training_registrations_training_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_training_registrations_training_id ON public.training_registrations USING btree (training_id);


--
-- Name: attendance attendance_officer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_officer_id_fkey FOREIGN KEY (officer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: attendance attendance_recorded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES public.profiles(id);


--
-- Name: attendance attendance_training_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_training_id_fkey FOREIGN KEY (training_id) REFERENCES public.trainings(id) ON DELETE CASCADE;


--
-- Name: companion_registrations companion_registrations_officer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companion_registrations
    ADD CONSTRAINT companion_registrations_officer_id_fkey FOREIGN KEY (officer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: companion_registrations companion_registrations_training_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companion_registrations
    ADD CONSTRAINT companion_registrations_training_id_fkey FOREIGN KEY (training_id) REFERENCES public.trainings(id) ON DELETE CASCADE;


--
-- Name: compliance_records compliance_records_cooperative_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance_records
    ADD CONSTRAINT compliance_records_cooperative_id_fkey FOREIGN KEY (cooperative_id) REFERENCES public.cooperatives(id) ON DELETE CASCADE;


--
-- Name: members members_cooperative_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_cooperative_id_fkey FOREIGN KEY (cooperative_id) REFERENCES public.cooperatives(id) ON DELETE CASCADE;


--
-- Name: training_registrations training_registrations_officer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_registrations
    ADD CONSTRAINT training_registrations_officer_id_fkey FOREIGN KEY (officer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: training_registrations training_registrations_training_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_registrations
    ADD CONSTRAINT training_registrations_training_id_fkey FOREIGN KEY (training_id) REFERENCES public.trainings(id) ON DELETE CASCADE;


--
-- Name: training_suggestions training_suggestions_officer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_suggestions
    ADD CONSTRAINT training_suggestions_officer_id_fkey FOREIGN KEY (officer_id) REFERENCES public.profiles(id);


--
-- PostgreSQL database dump complete
--

--
-- PostgreSQL database dump complete
--
