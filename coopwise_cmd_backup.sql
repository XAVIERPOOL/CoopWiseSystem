--
-- PostgreSQL database dump
--

\restrict gjRnn5LjFuhYXENKGAbcvAbn170sylepIUexJcqVl68i3vhbGsa4pDZkdyKLtwe

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
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.activity_logs VALUES (1, '22222222-2222-2222-2222-222222222222', 'Juan Miguel Santos', 'UPDATE', 'Training', 'Changed status of Member Education Seminar from upcoming to ongoing', '99025335-82c0-4e79-a721-46331d9bdbaf', '2026-01-09 18:49:27.006268');
INSERT INTO public.activity_logs VALUES (2, '22222222-2222-2222-2222-222222222222', 'VINCE CARLO P. SAN JOAQUIN', 'UPDATE', 'Training', 'Changed status of Road Rerouting  from ongoing to completed', '96f8d196-011b-43e8-97b7-4618c7c102c9', '2026-01-09 18:57:42.292309');
INSERT INTO public.activity_logs VALUES (3, '33333333-3333-3333-3333-333333333333', 'RONALD ALLAN POLAGÑE', 'UPDATE', 'Compliance', 'Updated CAPR Submission 2024 from submitted to non-compliant', '4002c7ef-6d70-4883-b000-b7e30d6345b9', '2026-01-09 19:08:54.369317');
INSERT INTO public.activity_logs VALUES (4, '11111111-1111-1111-1111-111111111111', 'XAVIER ANGELO JAMES LAGATIC', 'UPDATE', 'Compliance', 'Updated CAPR Submission 2024 from non-compliant to compliant', '4002c7ef-6d70-4883-b000-b7e30d6345b9', '2026-01-09 19:14:18.877465');
INSERT INTO public.activity_logs VALUES (5, '11111111-1111-1111-1111-111111111111', 'XAVIER ANGELO JAMES OSEA. LAGATIC', 'UPDATE', 'Membership', 'Updated membership for Roberto Mendoza from pending to rejected', '6d593919-0989-4f4d-aa90-3d75a0d6da65', '2026-01-13 19:21:10.918989');
INSERT INTO public.activity_logs VALUES (6, '22222222-2222-2222-2222-222222222222', 'VINCE CARLO P. SAN JOAQUIN', 'UPDATE', 'Training', 'Updated details for training: Financial Management Basics', 'ce223126-0198-4ef0-ab93-15e47661921d', '2026-01-14 09:47:26.999543');
INSERT INTO public.activity_logs VALUES (7, '22222222-2222-2222-2222-222222222222', 'VINCE CARLO P. SAN JOAQUIN', 'CREATE', 'Training', 'Created new training: Financial Management Basics', '984d1958-4b95-4e87-8591-32a4b9583c77', '2026-01-14 09:53:05.969834');
INSERT INTO public.activity_logs VALUES (8, '22222222-2222-2222-2222-222222222222', 'VINCE CARLO P. SAN JOAQUIN', 'UPDATE', 'Training', 'Updated details for training: Financial Management Basics', '984d1958-4b95-4e87-8591-32a4b9583c77', '2026-01-14 09:53:24.347588');
INSERT INTO public.activity_logs VALUES (9, '33333333-3333-3333-3333-333333333333', 'RONALD ALLAN N. POLAGÑE', 'UPDATE', 'Membership', 'Updated membership for Vince San Joaquin from pending to rejected', '29f60899-18bf-40fc-982d-6a51b60a598d', '2026-02-20 22:02:10.132766');
INSERT INTO public.activity_logs VALUES (10, '11111111-1111-1111-1111-111111111111', 'XAVIER ANGELO JAMES OSEA. LAGATIC', 'UPDATE', 'Membership', 'Updated membership for XAVIER ANGELO JAMES LAGATIC from pending to approved', '16a0fdbb-53a2-4c5f-94ee-b0b7b7824632', '2026-02-23 22:12:21.711363');
INSERT INTO public.activity_logs VALUES (11, '11111111-1111-1111-1111-111111111111', 'XAVIER ANGELO JAMES OSEA. LAGATIC', 'UPDATE', 'Membership', 'Updated membership for Bongbong Marcos from pending to approved', '1ae77787-569f-4174-b184-9cffd86a775d', '2026-02-23 22:13:29.161015');
INSERT INTO public.activity_logs VALUES (12, '11111111-1111-1111-1111-111111111111', 'XAVIER ANGELO JAMES OSEA. LAGATIC', 'UPDATE', 'Membership', 'Updated membership for Leni Robredo from pending to approved', '1e6094bb-1aa0-4600-88fa-8631a7fa1a43', '2026-02-23 22:14:07.676034');
INSERT INTO public.activity_logs VALUES (13, '11111111-1111-1111-1111-111111111111', 'XAVIER ANGELO JAMES OSEA. LAGATIC', 'UPDATE', 'Membership', 'Updated membership for Sarah Duterte from pending to rejected', '15b083a5-f7d7-4b67-951f-ab491ea437cc', '2026-02-23 22:14:58.981195');
INSERT INTO public.activity_logs VALUES (14, '11111111-1111-1111-1111-111111111111', 'XAVIER ANGELO JAMES OSEA. LAGATIC', 'CREATE', 'Training', 'Created new training: Website', '3aa45134-f642-4448-8b6f-7cde903e3b96', '2026-02-24 15:36:21.014173');
INSERT INTO public.activity_logs VALUES (15, '11111111-1111-1111-1111-111111111111', 'XAVIER ANGELO JAMES OSEA. LAGATIC', 'UPDATE', 'Training', 'Changed status of Financial Management Basics from upcoming to completed', '984d1958-4b95-4e87-8591-32a4b9583c77', '2026-02-26 10:12:49.595427');
INSERT INTO public.activity_logs VALUES (16, '11111111-1111-1111-1111-111111111111', 'XAVIER ANGELO JAMES OSEA. LAGATIC', 'UPDATE', 'Registration', 'Updated cooperative a from pending to approved', '8813954f-aa9e-4f2c-a5c9-1aa0c000f37b', '2026-03-03 23:08:15.423469');
INSERT INTO public.activity_logs VALUES (17, '11111111-1111-1111-1111-111111111111', 'XAVIER ANGELO JAMES OSEA. LAGATIC', 'CREATE', 'Training', 'Created new training: Governance', '47463ba6-c04a-4fd6-932c-31493ea6235b', '2026-03-03 23:27:05.927814');
INSERT INTO public.activity_logs VALUES (18, '11111111-1111-1111-1111-111111111111', 'XAVIER ANGELO JAMES OSEA. LAGATIC', 'UPDATE', 'Registration', 'Updated cooperative Try Coop from pending to approved', 'df6fb5a4-3bb9-4dac-a036-fa87e824f0f1', '2026-03-04 10:27:43.306653');
INSERT INTO public.activity_logs VALUES (21, '11111111-1111-1111-1111-111111111111', 'XAVIER ANGELO JAMES OSEA. LAGATIC', 'UPDATE', 'Registration', 'Updated cooperative Testing user from pending to approved', '6dfa7522-277c-4085-a1df-12f3294251c9', '2026-03-04 16:01:20.841903');
INSERT INTO public.activity_logs VALUES (22, '11111111-1111-1111-1111-111111111111', 'XAVIER ANGELO JAMES OSEA. LAGATIC', 'UPDATE', 'Registration', 'Updated cooperative Test2 from pending to approved', '22189995-8a3e-4780-b7c7-18d62b9f8fab', '2026-03-09 09:53:03.223549');
INSERT INTO public.activity_logs VALUES (23, '11111111-1111-1111-1111-111111111111', 'XAVIER ANGELO JAMES OSEA. LAGATIC', 'UPDATE', 'Membership', 'Updated membership for Bins Damesa from pending to approved', '1b3d5c01-c991-4965-8e09-1817560df725', '2026-03-09 11:52:07.13805');
INSERT INTO public.activity_logs VALUES (24, '11111111-1111-1111-1111-111111111111', 'XAVIER ANGELO JAMES OSEA. LAGATIC', 'UPDATE', 'Membership', 'Updated membership for Vico Sotto from pending to approved', 'ea7e66ba-3013-4c7f-a34f-c766a6ee750d', '2026-03-09 15:08:04.26075');
INSERT INTO public.activity_logs VALUES (25, '11111111-1111-1111-1111-111111111111', 'XAVIER ANGELO JAMES OSEA. LAGATIC', 'UPDATE', 'Membership', 'Updated membership for Juan Cruz from pending to approved', 'e3ea5303-12dd-4c87-9b95-a2cb7d813848', '2026-03-09 17:41:50.970302');
INSERT INTO public.activity_logs VALUES (26, '11111111-1111-1111-1111-111111111111', 'XAVIER ANGELO JAMES OSEA. LAGATIC', 'UPDATE', 'Membership', 'Updated membership for Avelinda Ritchlind from pending to approved', 'c7427a49-97c7-4d97-992f-53812f28e40b', '2026-03-10 11:20:22.132264');
INSERT INTO public.activity_logs VALUES (27, '11111111-1111-1111-1111-111111111111', 'XAVIER ANGELO JAMES OSEA. LAGATIC', 'UPDATE', 'Membership', 'Updated membership for Test Officer Compliance from pending to approved', '93359ebc-d396-40d2-a914-d2f624e033d1', '2026-03-10 13:55:14.383341');
INSERT INTO public.activity_logs VALUES (28, '11111111-1111-1111-1111-111111111111', 'XAVIER ANGELO JAMES OSEA. LAGATIC', 'UPDATE', 'Membership', 'Updated membership for Padi Padihon from pending to approved', 'f97e53b7-de63-4705-8ec9-6a844f521f23', '2026-03-10 14:14:09.642771');
INSERT INTO public.activity_logs VALUES (29, '11111111-1111-1111-1111-111111111111', 'XAVIER ANGELO JAMES OSEA. LAGATIC', 'UPDATE', 'Registration', 'Updated cooperative NagaCoop from pending to approved', 'dd254464-063c-436b-823c-534b716d39f2', '2026-03-12 11:23:10.008053');


--
-- Data for Name: attendance; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.attendance VALUES ('37ea5ef4-b26b-45b7-83d9-20fdea583f3d', '22222222-2222-2222-2222-222222222222', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '2025-11-02 14:38:09.056649+08', '11111111-1111-1111-1111-111111111111', 'manual', NULL);
INSERT INTO public.attendance VALUES ('1fbaf6f6-7a40-46c0-8993-9ad74b235034', '33333333-3333-3333-3333-333333333333', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '2025-11-02 14:38:09.056649+08', '11111111-1111-1111-1111-111111111111', 'qr', NULL);
INSERT INTO public.attendance VALUES ('c31d32c0-46a1-45cb-b346-f9cfa73dd30b', '22222222-2222-2222-2222-222222222222', '96f8d196-011b-43e8-97b7-4618c7c102c9', '2025-11-27 10:03:11.415823+08', '11111111-1111-1111-1111-111111111111', 'manual', '02:03:11');
INSERT INTO public.attendance VALUES ('0d7fb88d-98d8-4ee8-bc7b-0ac1527a6f8b', '33333333-3333-3333-3333-333333333333', '96f8d196-011b-43e8-97b7-4618c7c102c9', '2025-11-28 10:32:31.263416+08', '11111111-1111-1111-1111-111111111111', 'manual', '10:32:31');
INSERT INTO public.attendance VALUES ('a645d864-bd5e-43bf-9539-d23aa416424d', '55555555-5555-5555-5555-555555555555', '96f8d196-011b-43e8-97b7-4618c7c102c9', '2025-11-28 10:32:33.546852+08', '11111111-1111-1111-1111-111111111111', 'manual', '10:32:33');
INSERT INTO public.attendance VALUES ('c6af3737-d095-44e2-ac58-d81bdd9c62eb', '777b2468-b89d-4574-b255-d3236ec5ff90', '5515da98-1a78-421a-a4a5-d504a359ab4d', '2025-11-28 12:18:13.683254+08', '11111111-1111-1111-1111-111111111111', 'manual', '12:18:14');
INSERT INTO public.attendance VALUES ('8cb10644-ef18-45d4-9116-532189d8d66d', '55555555-5555-5555-5555-555555555555', '5515da98-1a78-421a-a4a5-d504a359ab4d', '2025-11-28 12:18:15.817645+08', '11111111-1111-1111-1111-111111111111', 'manual', '12:18:16');
INSERT INTO public.attendance VALUES ('f3ba611f-d75a-4b07-a742-6c89e67974c1', '33333333-3333-3333-3333-333333333333', '5515da98-1a78-421a-a4a5-d504a359ab4d', '2025-11-28 12:18:18.071674+08', '11111111-1111-1111-1111-111111111111', 'manual', '12:18:18');
INSERT INTO public.attendance VALUES ('60c27fca-1458-4481-a0e4-d95381385f64', '22222222-2222-2222-2222-222222222222', '5515da98-1a78-421a-a4a5-d504a359ab4d', '2025-11-28 12:18:20.732692+08', '11111111-1111-1111-1111-111111111111', 'manual', '12:18:21');
INSERT INTO public.attendance VALUES ('ef47df0e-442c-497c-90bd-3e6f28c93ce1', '44444444-4444-4444-4444-444444444444', '96f8d196-011b-43e8-97b7-4618c7c102c9', '2025-11-28 15:38:45.38938+08', '11111111-1111-1111-1111-111111111111', 'manual', '15:38:45');
INSERT INTO public.attendance VALUES ('30ec0836-5353-4321-b792-b51f19a460f7', '777b2468-b89d-4574-b255-d3236ec5ff90', '7d1e222e-cf73-45f4-9d52-0736ba071bda', '2026-01-09 18:20:40.99095+08', '22222222-2222-2222-2222-222222222222', 'manual', '18:20:40');
INSERT INTO public.attendance VALUES ('56b8baa2-d6a3-43de-9c17-6b011bbcbf05', '44444444-4444-4444-4444-444444444444', '7d1e222e-cf73-45f4-9d52-0736ba071bda', '2026-01-09 18:20:42.752504+08', '22222222-2222-2222-2222-222222222222', 'manual', '18:20:42');
INSERT INTO public.attendance VALUES ('24a145b5-d3e6-40c8-824b-d438fc400273', '55555555-5555-5555-5555-555555555555', '7d1e222e-cf73-45f4-9d52-0736ba071bda', '2026-01-09 18:20:44.184823+08', '22222222-2222-2222-2222-222222222222', 'manual', '18:20:44');
INSERT INTO public.attendance VALUES ('63502ec2-df0a-45d9-ae15-e4d6586f8b70', '33333333-3333-3333-3333-333333333333', '93b5cc50-579f-48e9-adb6-a31564777849', '2026-01-09 18:38:12.563699+08', '22222222-2222-2222-2222-222222222222', 'manual', '18:38:12');
INSERT INTO public.attendance VALUES ('0125392d-de69-4d9e-b7a8-f62270c9be80', '777b2468-b89d-4574-b255-d3236ec5ff90', '99025335-82c0-4e79-a721-46331d9bdbaf', '2026-01-16 10:14:28.91918+08', '11111111-1111-1111-1111-111111111111', 'manual', '10:14:28');
INSERT INTO public.attendance VALUES ('ea48ea12-588a-4fec-a5ba-e7d399f50f13', '44444444-4444-4444-4444-444444444444', '99025335-82c0-4e79-a721-46331d9bdbaf', '2026-01-16 10:14:31.008087+08', '11111111-1111-1111-1111-111111111111', 'manual', '10:14:31');
INSERT INTO public.attendance VALUES ('faab54fd-fd7b-4b8f-b1da-009b61c0b676', '55555555-5555-5555-5555-555555555555', '99025335-82c0-4e79-a721-46331d9bdbaf', '2026-01-16 10:14:32.947934+08', '11111111-1111-1111-1111-111111111111', 'manual', '10:14:32');
INSERT INTO public.attendance VALUES ('a897a6ac-5d23-42c0-b8c5-4649d42cb7c2', '33333333-3333-3333-3333-333333333333', '99025335-82c0-4e79-a721-46331d9bdbaf', '2026-01-16 10:14:34.562631+08', '11111111-1111-1111-1111-111111111111', 'manual', '10:14:34');
INSERT INTO public.attendance VALUES ('2e5ef541-6ff2-4dfd-a614-2850aaed2352', '33333333-3333-3333-3333-333333333333', '47463ba6-c04a-4fd6-932c-31493ea6235b', '2026-03-03 23:28:21.386626+08', '11111111-1111-1111-1111-111111111111', 'manual', '23:28:21');
INSERT INTO public.attendance VALUES ('ec19ba0a-8e8d-43ac-a56c-f681ccfce174', '55555555-5555-5555-5555-555555555555', '47463ba6-c04a-4fd6-932c-31493ea6235b', '2026-03-03 23:28:34.041146+08', '11111111-1111-1111-1111-111111111111', 'manual', '23:28:33');
INSERT INTO public.attendance VALUES ('8380d22a-7020-4e44-bfe4-9b3cd7ef99b9', '777b2468-b89d-4574-b255-d3236ec5ff90', '47463ba6-c04a-4fd6-932c-31493ea6235b', '2026-03-03 23:28:35.796604+08', '11111111-1111-1111-1111-111111111111', 'manual', '23:28:35');
INSERT INTO public.attendance VALUES ('79d585dd-2f1e-49cf-8193-58a2acb1fd28', '44444444-4444-4444-4444-444444444444', '47463ba6-c04a-4fd6-932c-31493ea6235b', '2026-03-03 23:28:40.369367+08', '11111111-1111-1111-1111-111111111111', 'manual', '23:28:40');
INSERT INTO public.attendance VALUES ('3122fd25-7166-47e2-8fe9-81f3903bbfb7', '33333333-3333-3333-3333-333333333333', '31ea07d3-78ac-46e3-8a8f-2ca4f52d6fe3', '2026-03-04 10:26:14.288185+08', '11111111-1111-1111-1111-111111111111', 'manual', '10:26:14');
INSERT INTO public.attendance VALUES ('b7645e76-0d10-4359-8df1-b90eb44da7ee', '55555555-5555-5555-5555-555555555555', '31ea07d3-78ac-46e3-8a8f-2ca4f52d6fe3', '2026-03-04 10:26:16.051948+08', '11111111-1111-1111-1111-111111111111', 'manual', '10:26:16');


--
-- Data for Name: companion_registrations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.companion_registrations VALUES ('967c814c-c328-41c6-81e6-4f6f64425520', '96f8d196-011b-43e8-97b7-4618c7c102c9', '33333333-3333-3333-3333-333333333333', 'XAVIER ANGELO JAMES LAGATIC', 'xavier@companion.com', '09951063518', 'member', '2025-11-18 00:27:35.161026+08', '2025-11-18 00:27:35.161026+08');
INSERT INTO public.companion_registrations VALUES ('29906485-f387-49af-bb71-2472231dbbbc', '5515da98-1a78-421a-a4a5-d504a359ab4d', '33333333-3333-3333-3333-333333333333', 'xavier', 'xavier@example.companion', 'wq123123123', 'Member', '2025-11-28 12:08:19.91472+08', '2025-11-28 12:08:19.91472+08');
INSERT INTO public.companion_registrations VALUES ('b5c1a2f9-d49a-41ff-9a5e-494a353877de', '93b5cc50-579f-48e9-adb6-a31564777849', '33333333-3333-3333-3333-333333333333', 'BIns', 'bins@gmail.com', '12312312312312', 'Member', '2025-11-28 16:48:43.127564+08', '2025-11-28 16:48:43.127564+08');
INSERT INTO public.companion_registrations VALUES ('2d26d045-0890-45be-81ab-20193e750ef8', '93b5cc50-579f-48e9-adb6-a31564777849', '33333333-3333-3333-3333-333333333333', 'Nad', 'Nad@gmail.com', '21312321312321', 'Memeber', '2025-11-28 16:48:43.127564+08', '2025-11-28 16:48:43.127564+08');
INSERT INTO public.companion_registrations VALUES ('46b1874c-93d4-4845-b256-ebe28ab4efb8', '5515da98-1a78-421a-a4a5-d504a359ab4d', '33333333-3333-3333-3333-333333333333', 'XAVIER ANGELO JAMES LAGATIC', 'xavier@coopwise.com', '09090909090', 'Member', '2026-01-09 14:19:21.149992+08', '2026-01-09 14:19:21.149992+08');
INSERT INTO public.companion_registrations VALUES ('3de7f98c-c1e5-45e4-a92c-2d5f2c984905', '4f004db1-deda-45a9-8433-91a6794e82e8', '33333333-3333-3333-3333-333333333333', 'VINCE CARLO P. SAN JOAQUIN', 'VINCE@companion.com', '213123213123', 'Member', '2026-01-09 18:23:46.13518+08', '2026-01-09 18:23:46.13518+08');
INSERT INTO public.companion_registrations VALUES ('69475b83-9891-4cf8-9bd0-ffa82b4a2064', '99025335-82c0-4e79-a721-46331d9bdbaf', '33333333-3333-3333-3333-333333333333', 'bins', 'bins@batahangaw.com', '1231231231231', 'member', '2026-01-16 10:13:58.897152+08', '2026-01-16 10:13:58.897152+08');


--
-- Data for Name: compliance_records; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.compliance_records VALUES ('3bd42741-9dd6-4cc0-8225-620687960250', 'a87dc298-688c-42de-a96e-64837cc9b3ca', 'Financial', 'Annual Tax Incentive Report', NULL, '2026-04-15', NULL, 'compliant', '[]', NULL, NULL, NULL, 2026, '2026-01-16 10:07:39.459737+08', '2026-01-16 10:07:39.459737+08');
INSERT INTO public.compliance_records VALUES ('5f5b4269-3c58-4adc-9efd-1b55cbe204d3', 'a87dc298-688c-42de-a96e-64837cc9b3ca', 'Legal', 'Renewal of Franchise', NULL, '2026-05-15', NULL, 'pending', '[]', NULL, NULL, NULL, 2026, '2026-01-16 10:07:39.459737+08', '2026-01-16 10:07:39.459737+08');
INSERT INTO public.compliance_records VALUES ('d9a8faa5-5632-4856-b076-e9384d497d40', 'a71d3a26-4612-4a59-a3ad-10f9052ecd0e', 'Administrative', 'Vehicle Registration Summary', NULL, '2026-03-01', NULL, 'non-compliant', '[]', NULL, NULL, NULL, 2026, '2026-01-16 10:07:39.459737+08', '2026-01-16 10:07:39.459737+08');
INSERT INTO public.compliance_records VALUES ('cb88f38a-5d78-4d5e-bd15-87d2028e5a4f', '1661eec1-539d-45b7-a1d5-4203782a0d98', 'Social', 'Social Audit Report', NULL, '2026-05-30', NULL, 'pending', '[]', NULL, NULL, NULL, 2026, '2026-01-16 10:07:39.459737+08', '2026-01-16 10:07:39.459737+08');
INSERT INTO public.compliance_records VALUES ('08e916b5-674d-4bfd-8746-f49c4f497a2f', '1661eec1-539d-45b7-a1d5-4203782a0d98', 'Operational', 'Farm Inputs Inventory', NULL, '2026-04-01', NULL, 'compliant', '[]', NULL, NULL, NULL, 2026, '2026-01-16 10:07:39.459737+08', '2026-01-16 10:07:39.459737+08');
INSERT INTO public.compliance_records VALUES ('363467ae-316c-44dd-bc51-ebf60f91ee8e', 'b600910f-7889-44b0-bf2a-244748e383b6', 'Operational', 'Crop Production Report', NULL, '2026-06-15', NULL, 'pending', '[]', NULL, NULL, NULL, 2026, '2026-01-16 10:07:39.459737+08', '2026-01-16 10:07:39.459737+08');
INSERT INTO public.compliance_records VALUES ('a28289dd-a1a1-4fca-a46d-09c4e1063ecb', '24679813-6d51-4475-a986-02a78c7cd63e', 'Administrative', 'General Information Sheet', NULL, '2026-03-30', NULL, 'non-compliant', '[]', NULL, NULL, NULL, 2026, '2026-01-16 10:07:39.459737+08', '2026-01-16 10:07:39.459737+08');
INSERT INTO public.compliance_records VALUES ('7a55834b-5abd-4aef-bb34-78d34ce8261a', '9e8fa110-8b51-4651-8f92-6497161e8180', 'Operational', 'Safety Standards Certificate', NULL, '2026-02-15', NULL, 'compliant', '[]', NULL, NULL, NULL, 2026, '2026-01-16 10:07:39.459737+08', '2026-01-16 10:07:39.459737+08');
INSERT INTO public.compliance_records VALUES ('1c61ed18-2f0c-41ac-a35a-8109dc45bbf2', '090f3ed5-2577-45d7-b013-3a3842ebb79d', 'Financial', 'Financial Statement', NULL, '2026-04-15', NULL, 'compliant', '[]', NULL, NULL, NULL, 2026, '2026-01-16 10:07:39.459737+08', '2026-01-16 10:07:39.459737+08');
INSERT INTO public.compliance_records VALUES ('fe2fa741-22bc-4f7b-ad9e-cb630e0ccb13', '7071ac86-005b-4ec4-ab14-5628cd4c2295', 'Operational', 'Service Performance Review', NULL, '2026-05-20', NULL, 'pending', '[]', NULL, NULL, NULL, 2026, '2026-01-16 10:07:39.459737+08', '2026-01-16 10:07:39.459737+08');
INSERT INTO public.compliance_records VALUES ('e890a22d-aace-4b11-b09e-d05d99454577', 'be733746-7ca2-45ed-94fc-8725fbdc9132', 'Administrative', 'List of Officers', NULL, '2026-06-15', NULL, 'pending', '[]', NULL, NULL, NULL, 2026, '2026-01-16 10:07:39.459737+08', '2026-01-16 10:07:39.459737+08');
INSERT INTO public.compliance_records VALUES ('f89bd2df-8b53-4cf8-a68a-ae722fb1562f', 'febfd1fd-b4bf-4c9e-a482-071654ff3d15', 'Legal', 'Land Title Status Report', NULL, '2026-01-30', NULL, 'compliant', '[]', NULL, NULL, NULL, 2026, '2026-01-16 10:07:39.459737+08', '2026-01-16 10:07:39.459737+08');
INSERT INTO public.compliance_records VALUES ('1a2191a8-1f00-49a1-bcd1-eaaa1cb26028', 'da07b0af-1baf-4918-b261-a20e1b575753', 'Social', 'Medical Mission Report', NULL, '2026-02-20', NULL, 'compliant', '[]', NULL, NULL, NULL, 2026, '2026-01-16 10:07:39.459737+08', '2026-01-16 10:07:39.459737+08');
INSERT INTO public.compliance_records VALUES ('d3889a6a-36ee-4ea7-9d37-b04fc17fdc15', 'd3b1b072-3b58-4977-8999-ce00a9c632ad', 'Legal', 'Pharmacy License Renewal', NULL, '2026-07-01', NULL, 'pending', '[]', NULL, NULL, NULL, 2026, '2026-01-16 10:07:39.459737+08', '2026-01-16 10:07:39.459737+08');
INSERT INTO public.compliance_records VALUES ('46472c7f-c4c8-4888-8478-7bf2451c7c34', 'a87dc298-688c-42de-a96e-64837cc9b3ca', 'Financial', 'Annual Tax Incentive Report', NULL, '2026-04-15', NULL, 'compliant', '[]', NULL, NULL, NULL, 2026, '2026-01-16 09:46:21.701326+08', '2026-01-16 09:46:21.701326+08');
INSERT INTO public.compliance_records VALUES ('3da2d71d-619c-420e-b903-4572c7a62b5d', 'a87dc298-688c-42de-a96e-64837cc9b3ca', 'Administrative', 'List of Drivers/Operators', NULL, '2026-05-30', NULL, 'pending', '[]', NULL, NULL, NULL, 2026, '2026-01-16 09:46:21.701326+08', '2026-01-16 09:46:21.701326+08');
INSERT INTO public.compliance_records VALUES ('f5365fb3-fc24-42c8-8788-f3c73198e2a2', '1661eec1-539d-45b7-a1d5-4203782a0d98', 'Social', 'Farm Inputs Report', NULL, '2026-02-20', NULL, 'compliant', '[]', NULL, NULL, NULL, 2026, '2026-01-16 09:46:21.701326+08', '2026-01-16 09:46:21.701326+08');
INSERT INTO public.compliance_records VALUES ('7547d27c-772b-4c2c-a7b4-be23ea8ed708', '1661eec1-539d-45b7-a1d5-4203782a0d98', 'Financial', 'Crop Harvest Audit', NULL, '2026-01-15', NULL, 'non-compliant', '[]', NULL, NULL, NULL, 2026, '2026-01-16 09:46:21.701326+08', '2026-01-16 09:46:21.701326+08');
INSERT INTO public.compliance_records VALUES ('1cff4a92-e50c-4381-b12b-9d6b58750676', '24679813-6d51-4475-a986-02a78c7cd63e', 'Environmental', 'Waste Management Plan', NULL, '2026-06-15', NULL, 'pending', '[]', NULL, NULL, NULL, 2026, '2026-01-16 09:46:21.701326+08', '2026-01-16 09:46:21.701326+08');
INSERT INTO public.compliance_records VALUES ('e2830441-b42e-4297-bbad-76fc8a4de27d', '090f3ed5-2577-45d7-b013-3a3842ebb79d', 'Financial', 'Audited Financial Statement', NULL, '2026-04-15', NULL, 'compliant', '[]', NULL, NULL, NULL, 2026, '2026-01-16 09:46:21.701326+08', '2026-01-16 09:46:21.701326+08');
INSERT INTO public.compliance_records VALUES ('ae1d5841-13e9-4a53-a411-404c2996e3a1', '090f3ed5-2577-45d7-b013-3a3842ebb79d', 'Social', 'Community Service Report', NULL, '2026-08-30', NULL, 'pending', '[]', NULL, NULL, NULL, 2026, '2026-01-16 09:46:21.701326+08', '2026-01-16 09:46:21.701326+08');
INSERT INTO public.compliance_records VALUES ('d5fe3ede-021b-421a-92af-0f18dc5370a1', 'be733746-7ca2-45ed-94fc-8725fbdc9132', 'Administrative', 'Land Title Summary', NULL, '2026-03-10', NULL, 'compliant', '[]', NULL, NULL, NULL, 2026, '2026-01-16 09:46:21.701326+08', '2026-01-16 09:46:21.701326+08');
INSERT INTO public.compliance_records VALUES ('3939e963-8d34-4847-b21e-ad56a617f2fa', 'da07b0af-1baf-4918-b261-a20e1b575753', 'Operational', 'Health & Safety Permit', NULL, '2026-01-30', NULL, 'compliant', '[]', NULL, NULL, NULL, 2026, '2026-01-16 09:46:21.701326+08', '2026-01-16 09:46:21.701326+08');


--
-- Data for Name: cooperatives; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.cooperatives VALUES ('b096da52-5165-48d1-a48b-10dc992ad8b8', NULL, 'Naga Consumer Goods Cooperative', 'consumer', '321 Peñafrancia Ave', 'Naga City', 'Camarines Sur', 'Bicol Region', 'REG-2024-004', '2024-04-05', '456-789-012-003', 'Rosa Garcia', 'rosa@nagaconsumer.ph', '0920-456-7890', 'needs_resubmission', '[]', 'Missing financial statements for previous year. Please resubmit.', NULL, NULL, '2025-12-13 21:34:20.183048+08', '2025-12-23 21:34:20.183048+08');
INSERT INTO public.cooperatives VALUES ('16edf283-7f10-4882-ab8b-66b9ae0644e7', NULL, 'Rinconada Workers Cooperative', 'workers', '987 Rinconada Road', 'Iriga City', 'Camarines Sur', 'Bicol Region', 'REG-2024-006', '2024-06-18', '678-901-234-005', 'Ana Villanueva', 'ana@rinconadaworkers.coop', '0922-678-9012', 'rejected', '[]', 'Incomplete membership requirements. Minimum 15 members needed.', NULL, NULL, '2025-12-03 21:34:20.183048+08', '2025-12-23 21:34:20.183048+08');
INSERT INTO public.cooperatives VALUES ('7f9b4fe6-5b37-4fcf-8763-e2614d71edd7', 'COOP-MK53XA4H', 'CAPATRANSCO', 'Multi-Purpose Cooperative', 'Carolina ', 'Naga City', 'Camarines Sur', 'Region V (Bicol)', '23456', '2026-01-07', '111111', 'Mark De Mesa', 'markdemesa@gmail.com', '09982152371', 'approved', '[]', '', '11111111-1111-1111-1111-111111111111', '2026-01-09 19:10:18.500058+08', '2026-01-08 15:09:41.400153+08', '2026-01-09 19:10:18.500058+08');
INSERT INTO public.cooperatives VALUES ('a87dc298-688c-42de-a96e-64837cc9b3ca', 'TRANS-001', 'Naga City Transport Service', 'Transportation', 'CBD Terminal', 'Naga City', 'Camarines Sur', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'approved', '[]', NULL, NULL, NULL, '2026-01-16 09:26:57.154738+08', '2026-01-16 09:26:57.154738+08');
INSERT INTO public.cooperatives VALUES ('1661eec1-539d-45b7-a1d5-4203782a0d98', 'AGRI-001', 'Isarog Farmers Producers', 'Agriculture', 'Panicuason', 'Naga City', 'Camarines Sur', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'approved', '[]', NULL, NULL, NULL, '2026-01-16 09:26:57.154738+08', '2026-01-16 09:26:57.154738+08');
INSERT INTO public.cooperatives VALUES ('24679813-6d51-4475-a986-02a78c7cd63e', 'IND-001', 'Bicol Industrial Workers', 'Industrial', 'Concepcion Grande', 'Naga City', 'Camarines Sur', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'approved', '[]', NULL, NULL, NULL, '2026-01-16 09:26:57.154738+08', '2026-01-16 09:26:57.154738+08');
INSERT INTO public.cooperatives VALUES ('090f3ed5-2577-45d7-b013-3a3842ebb79d', 'SERV-001', 'Metro Naga Service Coop', 'Service', 'Panganiban Drive', 'Naga City', 'Camarines Sur', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'approved', '[]', NULL, NULL, NULL, '2026-01-16 09:26:57.154738+08', '2026-01-16 09:26:57.154738+08');
INSERT INTO public.cooperatives VALUES ('be733746-7ca2-45ed-94fc-8725fbdc9132', 'HOUSE-001', 'Urban Poor Housing Project', 'Housing', 'Balatas', 'Naga City', 'Camarines Sur', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'approved', '[]', NULL, NULL, NULL, '2026-01-16 09:26:57.154738+08', '2026-01-16 09:26:57.154738+08');
INSERT INTO public.cooperatives VALUES ('da07b0af-1baf-4918-b261-a20e1b575753', 'HEALTH-001', 'Community Wellness Center', 'Health', 'Magsaysay Ave', 'Naga City', 'Camarines Sur', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'approved', '[]', NULL, NULL, NULL, '2026-01-16 09:26:57.154738+08', '2026-01-16 09:26:57.154738+08');
INSERT INTO public.cooperatives VALUES ('a71d3a26-4612-4a59-a3ad-10f9052ecd0e', 'TRANS-002', 'Bicol Express Jeepney Operators', 'Transportation', 'Pili Drive', 'Naga City', 'Camarines Sur', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'approved', '[]', NULL, NULL, NULL, '2026-01-16 10:07:39.459737+08', '2026-01-16 10:07:39.459737+08');
INSERT INTO public.cooperatives VALUES ('b600910f-7889-44b0-bf2a-244748e383b6', 'AGRI-002', 'CamSur Rice Granary Coop', 'Agricultural', 'Milaor', 'Camarines Sur', 'Camarines Sur', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'approved', '[]', NULL, NULL, NULL, '2026-01-16 10:07:39.459737+08', '2026-01-16 10:07:39.459737+08');
INSERT INTO public.cooperatives VALUES ('9e8fa110-8b51-4651-8f92-6497161e8180', 'IND-002', 'Naga Manufacturing United', 'Industrial', 'San Felipe', 'Naga City', 'Camarines Sur', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'approved', '[]', NULL, NULL, NULL, '2026-01-16 10:07:39.459737+08', '2026-01-16 10:07:39.459737+08');
INSERT INTO public.cooperatives VALUES ('7071ac86-005b-4ec4-ab14-5628cd4c2295', 'SERV-002', 'Professional IT Solutions Coop', 'Service', 'Magsaysay Ave', 'Naga City', 'Camarines Sur', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'approved', '[]', NULL, NULL, NULL, '2026-01-16 10:07:39.459737+08', '2026-01-16 10:07:39.459737+08');
INSERT INTO public.cooperatives VALUES ('febfd1fd-b4bf-4c9e-a482-071654ff3d15', 'HOUSE-002', 'Teacher''s Village Housing Coop', 'Housing', 'Pacol', 'Naga City', 'Camarines Sur', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'approved', '[]', NULL, NULL, NULL, '2026-01-16 10:07:39.459737+08', '2026-01-16 10:07:39.459737+08');
INSERT INTO public.cooperatives VALUES ('d3b1b072-3b58-4977-8999-ce00a9c632ad', 'HEALTH-002', 'Bicol Medical Professionals', 'Health & Wellness', 'Panganiban', 'Naga City', 'Camarines Sur', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'approved', '[]', NULL, NULL, NULL, '2026-01-16 10:07:39.459737+08', '2026-01-16 10:07:39.459737+08');
INSERT INTO public.cooperatives VALUES ('8813954f-aa9e-4f2c-a5c9-1aa0c000f37b', 'COOP-MMAOSTNX', 'a', 'Credit Cooperative', 'STA.CRUZ BLK 11 LOT 11
STA. CRUZ BLK11 LOT 1
JOLLYNEIGHBORS STA.CRUZ', 'NAGA CITY', 'CAMARINES SUR', 'Region V (Bicol)', '212', '2026-03-11', '12121212', 'asdasd', 'asdasd', 'asdasd', 'approved', '[{"name": "640476927_900965889583514_8351909261891024675_n.jpg", "path": "/uploads/1772547138834-122689681-640476927_900965889583514_8351909261891024675_n.jpg", "size": 315173, "type": "image/jpeg", "uploadedAt": "2026-03-03T14:12:18.861Z", "document_type": "cda_certificate"}, {"name": "2.-Parent_s-Permit-final.pdf", "path": "/uploads/1772547138840-649413466-2.-Parent_s-Permit-final.pdf", "size": 114309, "type": "application/pdf", "uploadedAt": "2026-03-03T14:12:18.861Z", "document_type": "articles_of_cooperation"}, {"name": "640476927_900965889583514_8351909261891024675_n.jpg", "path": "/uploads/1772547138844-903836533-640476927_900965889583514_8351909261891024675_n.jpg", "size": 315173, "type": "image/jpeg", "uploadedAt": "2026-03-03T14:12:18.861Z", "document_type": "valid_id"}]', '', '11111111-1111-1111-1111-111111111111', NULL, '2026-03-03 22:12:18.912069+08', '2026-03-03 23:08:15.423469+08');
INSERT INTO public.cooperatives VALUES ('df6fb5a4-3bb9-4dac-a036-fa87e824f0f1', 'COOP-MMBF2AUT', 'Try Coop', 'Transport Cooperative', 'STA.CRUZ BLK 11 LOT 11
STA. CRUZ BLK11 LOT 1
JOLLYNEIGHBORS STA.CRUZ', 'NAGA CITY', 'CAMARINES SUR', 'Region V (Bicol)', '123123123', '2026-03-05', '123123123123', '123123123', '123123123', '123123123', 'approved', '[{"name": "642119964_1511118523765482_6416611174238279607_n.jpg", "path": "/uploads/1772591251049-685831441-642119964_1511118523765482_6416611174238279607_n.jpg", "size": 266434, "type": "image/jpeg", "uploadedAt": "2026-03-04T02:27:31.061Z", "document_type": "cda_certificate"}, {"name": "2.-Parent_s-Permit-final.pdf", "path": "/uploads/1772591251052-555157798-2.-Parent_s-Permit-final.pdf", "size": 114309, "type": "application/pdf", "uploadedAt": "2026-03-04T02:27:31.061Z", "document_type": "articles_of_cooperation"}, {"name": "640476927_900965889583514_8351909261891024675_n.jpg", "path": "/uploads/1772591251053-839886303-640476927_900965889583514_8351909261891024675_n.jpg", "size": 315173, "type": "image/jpeg", "uploadedAt": "2026-03-04T02:27:31.061Z", "document_type": "valid_id"}]', '', '11111111-1111-1111-1111-111111111111', NULL, '2026-03-04 10:27:31.090476+08', '2026-03-04 10:27:43.306653+08');
INSERT INTO public.cooperatives VALUES ('6dfa7522-277c-4085-a1df-12f3294251c9', 'COOP-MMBQ3ZL4', 'Testing user', 'Consumer Cooperative', 'STA.CRUZ BLK 11 LOT 11
STA. CRUZ BLK11 LOT 1
JOLLYNEIGHBORS STA.CRUZ', 'NAGA CITY', 'CAMARINES SUR', 'Region V (Bicol)', '123123213123123', '2026-03-04', '123123123123123', 'nadbinsdamesa', 'nadbinsdamesa@gmail.com', '21312313123213123', 'approved', '[{"name": "640476927_900965889583514_8351909261891024675_n.jpg", "path": "/uploads/1772609805510-513531954-640476927_900965889583514_8351909261891024675_n.jpg", "size": 315173, "type": "image/jpeg", "uploadedAt": "2026-03-04T07:36:45.544Z", "document_type": "cda_certificate"}, {"name": "2.-Parent_s-Permit-final.pdf", "path": "/uploads/1772609805524-100455172-2.-Parent_s-Permit-final.pdf", "size": 114309, "type": "application/pdf", "uploadedAt": "2026-03-04T07:36:45.544Z", "document_type": "articles_of_cooperation"}, {"name": "640476927_900965889583514_8351909261891024675_n.jpg", "path": "/uploads/1772609805529-320925449-640476927_900965889583514_8351909261891024675_n.jpg", "size": 315173, "type": "image/jpeg", "uploadedAt": "2026-03-04T07:36:45.544Z", "document_type": "valid_id"}]', '', '11111111-1111-1111-1111-111111111111', NULL, '2026-03-04 15:36:45.627613+08', '2026-03-04 16:01:20.841903+08');
INSERT INTO public.cooperatives VALUES ('22189995-8a3e-4780-b7c7-18d62b9f8fab', 'COOP-MMIJ10HH', 'Test2', 'Credit Cooperative', 'STA.CRUZ BLK 11 LOT 11
STA. CRUZ BLK11 LOT 1
JOLLYNEIGHBORS STA.CRUZ', 'NAGA CITY', 'CAMARINES SUR', 'Region V (Bicol)', '123456789', '2026-03-09', '12345678', 'Mark Vincent', 'MarkVincent@gmail.com', '12345678900', 'approved', '[{"name": "642119964_1511118523765482_6416611174238279607_n.jpg", "path": "/uploads/1773021172650-288384639-642119964_1511118523765482_6416611174238279607_n.jpg", "size": 266434, "type": "image/jpeg", "uploadedAt": "2026-03-09T01:52:52.661Z", "document_type": "cda_certificate"}, {"name": "2.-Parent_s-Permit-final.pdf", "path": "/uploads/1773021172653-347486902-2.-Parent_s-Permit-final.pdf", "size": 114309, "type": "application/pdf", "uploadedAt": "2026-03-09T01:52:52.661Z", "document_type": "articles_of_cooperation"}, {"name": "640476927_900965889583514_8351909261891024675_n.jpg", "path": "/uploads/1773021172655-946281777-640476927_900965889583514_8351909261891024675_n.jpg", "size": 315173, "type": "image/jpeg", "uploadedAt": "2026-03-09T01:52:52.661Z", "document_type": "valid_id"}]', '', '11111111-1111-1111-1111-111111111111', NULL, '2026-03-09 09:52:52.798618+08', '2026-03-09 09:53:03.223549+08');
INSERT INTO public.cooperatives VALUES ('dd254464-063c-436b-823c-534b716d39f2', 'COOP-MMMWK1CC', 'NagaCoop', 'Consumer Cooperative', 'Abella', 'Naga City', 'Camarines Sur', 'Region V (Bicol)', '1234567890', '2026-03-12', '0987654321', 'Mark Vincent', 'mari@gmail.com', '1234567890', 'approved', '[{"name": "Screenshot 2024-10-17 202339.png", "path": "/uploads/1773285759907-497969191-Screenshot 2024-10-17 202339.png", "size": 713081, "type": "image/png", "uploadedAt": "2026-03-12T03:22:39.948Z", "document_type": "cda_certificate"}, {"name": "2.-Parent_s-Permit-final.pdf", "path": "/uploads/1773285759930-110919153-2.-Parent_s-Permit-final.pdf", "size": 114309, "type": "application/pdf", "uploadedAt": "2026-03-12T03:22:39.948Z", "document_type": "articles_of_cooperation"}, {"name": "642119964_1511118523765482_6416611174238279607_n.jpg", "path": "/uploads/1773285759934-529233800-642119964_1511118523765482_6416611174238279607_n.jpg", "size": 266434, "type": "image/jpeg", "uploadedAt": "2026-03-12T03:22:39.948Z", "document_type": "valid_id"}]', '', '11111111-1111-1111-1111-111111111111', NULL, '2026-03-12 11:22:40.022089+08', '2026-03-12 11:23:10.008053+08');


--
-- Data for Name: members; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.members VALUES ('1e6094bb-1aa0-4600-88fa-8631a7fa1a43', 'MBR-MLZ9C9ZN', 'd3b1b072-3b58-4977-8999-ce00a9c632ad', 'Leni', '', 'Robredo', NULL, '2026-02-23', 'Not Specified', 'Not Specified', 'STA.CRUZ BLK 11 LOT 11
STA. CRUZ BLK11 LOT 1
JOLLYNEIGHBORS STA.CRUZ', 'NAGA CITY', 'Camarines Sur', 'leni@gmail.com', '123123123123', 'President', 'N/A', NULL, '[]', 'approved', '2026-02-23', '', '11111111-1111-1111-1111-111111111111', '2026-02-23 22:14:07.676034+08', '2026-02-23 22:14:04.691624+08', '2026-02-23 22:14:07.676034+08', 'Regular Member');
INSERT INTO public.members VALUES ('93359ebc-d396-40d2-a914-d2f624e033d1', 'MBR-MMK6Y0RW', '6dfa7522-277c-4085-a1df-12f3294251c9', 'Test', 'User', 'Officer Compliance', NULL, '2026-03-10', 'Not Specified', 'Not Specified', 'STA.CRUZ BLK 11 LOT 11
STA. CRUZ BLK11 LOT 1
JOLLYNEIGHBORS STA.CRUZ', 'NAGA CITY', 'Camarines Sur', 'test@gmail.com', '09876543211', 'Compliance', 'N/A', NULL, '[]', 'approved', '2026-03-10', '', '11111111-1111-1111-1111-111111111111', '2026-03-10 13:55:14.383341+08', '2026-03-10 13:50:10.029958+08', '2026-03-10 13:55:14.383341+08', 'Representative');
INSERT INTO public.members VALUES ('1ae77787-569f-4174-b184-9cffd86a775d', 'MBR-MLZ9BEKP', '7071ac86-005b-4ec4-ab14-5628cd4c2295', 'Bongbong', 'O', 'Marcos', NULL, '2026-02-22', 'Not Specified', 'Not Specified', 'STA.CRUZ BLK 11 LOT 11
STA. CRUZ BLK11 LOT 1
JOLLYNEIGHBORS STA.CRUZ', 'NAGA CITY', 'Camarines Sur', 'xavierangelojames@gmail.com', '+639951063518', 'Secretary', 'N/A', NULL, '[]', 'approved', '2026-02-23', '', '11111111-1111-1111-1111-111111111111', '2026-02-23 22:13:29.161015+08', '2026-02-23 22:13:23.977609+08', '2026-02-25 19:14:54.204658+08', 'President');
INSERT INTO public.members VALUES ('15b083a5-f7d7-4b67-951f-ab491ea437cc', 'MBR-MLZ9D1VZ', '7071ac86-005b-4ec4-ab14-5628cd4c2295', 'Sarah', '', 'Duterte', NULL, '2026-02-20', 'Not Specified', 'Not Specified', 'STA.CRUZ BLK 11 LOT 11
STA. CRUZ BLK11 LOT 1
JOLLYNEIGHBORS STA.CRUZ', 'Davao', 'Camarines Sur', 'Duterte@gmail.com', '123123123123', 'P;underist', 'N/A', NULL, '[]', 'rejected', NULL, 'Rejected due to confidential Funds missing', '11111111-1111-1111-1111-111111111111', '2026-02-23 22:14:58.981195+08', '2026-02-23 22:14:40.848534+08', '2026-02-25 19:15:07.940322+08', 'Regular Member');
INSERT INTO public.members VALUES ('16a0fdbb-53a2-4c5f-94ee-b0b7b7824632', 'MBR-MLZ99JLB', 'febfd1fd-b4bf-4c9e-a482-071654ff3d15', 'XAVIER ANGELO JAMES', 'O', 'LAGATIC', NULL, '2026-02-22', 'Not Specified', 'Not Specified', 'STA.CRUZ BLK 11 LOT 11
STA. CRUZ BLK11 LOT 1
JOLLYNEIGHBORS STA.CRUZ', 'NAGA CITY', 'Camarines Sur', 'xavierangelojames@gmail.com', '+639951063518', 'Head', 'N/A', NULL, '[]', 'approved', '2026-02-23', '', '11111111-1111-1111-1111-111111111111', '2026-02-23 22:12:21.711363+08', '2026-02-23 22:11:57.167816+08', '2026-02-25 19:18:17.610498+08', 'President');
INSERT INTO public.members VALUES ('f97e53b7-de63-4705-8ec9-6a844f521f23', 'MBR-MMK7SSC3', '8813954f-aa9e-4f2c-a5c9-1aa0c000f37b', 'Padi', 'bro', 'Padihon', NULL, '2026-03-10', 'Not Specified', 'Not Specified', 'STA.CRUZ BLK 11 LOT 11
STA. CRUZ BLK11 LOT 1
JOLLYNEIGHBORS STA.CRUZ', 'NAGA CITY', 'Camarines Sur', 'padi@gmail.com', '09876543211', 'Assassin', 'N/A', NULL, '[]', 'approved', '2026-03-10', '', '11111111-1111-1111-1111-111111111111', '2026-03-10 14:14:09.642771+08', '2026-03-10 14:14:05.428128+08', '2026-03-10 14:14:09.642771+08', 'Representative');
INSERT INTO public.members VALUES ('1b3d5c01-c991-4965-8e09-1817560df725', 'MBR-MMBF3U0E', 'df6fb5a4-3bb9-4dac-a036-fa87e824f0f1', 'Bins', 'San', 'Damesa', NULL, '2026-03-03', 'Not Specified', 'Not Specified', 'STA.CRUZ BLK 11 LOT 11
STA. CRUZ BLK11 LOT 1
JOLLYNEIGHBORS STA.CRUZ', 'NAGA CITY', 'Camarines Sur', 'Binsdamesa@gmail.com', '21312312312', 'Driver', 'N/A', NULL, '[]', 'approved', '2026-03-09', '', '11111111-1111-1111-1111-111111111111', '2026-03-09 11:52:07.13805+08', '2026-03-04 10:28:42.543307+08', '2026-03-09 11:52:07.13805+08', 'Treasurer');
INSERT INTO public.members VALUES ('ea7e66ba-3013-4c7f-a34f-c766a6ee750d', 'MBR-MM1XSS6F', 'a71d3a26-4612-4a59-a3ad-10f9052ecd0e', 'Vico', 'PADI', 'Sotto', NULL, '2026-02-25', 'Not Specified', 'Not Specified', 'STA.CRUZ BLK 11 LOT 11
STA. CRUZ BLK11 LOT 1
JOLLYNEIGHBORS STA.CRUZ', 'Pasig', 'Camarines Sur', 'vicosotto@gmail.com', '123123123123', 'Mayor', 'N/A', NULL, '[]', 'approved', '2026-03-09', '', '11111111-1111-1111-1111-111111111111', '2026-03-09 15:08:04.26075+08', '2026-02-25 19:14:17.897574+08', '2026-03-09 15:08:04.26075+08', 'President');
INSERT INTO public.members VALUES ('e3ea5303-12dd-4c87-9b95-a2cb7d813848', 'MBR-MMIZS1AO', '22189995-8a3e-4780-b7c7-18d62b9f8fab', 'Juan', 'Dela', 'Cruz', NULL, '2026-03-09', 'Not Specified', 'Not Specified', 'Street ADress', 'Naga City', 'Camarines Sur', 'juan@gmail.com', '123123123123', 'Farmer', 'N/A', NULL, '[]', 'approved', '2026-03-09', '', '11111111-1111-1111-1111-111111111111', '2026-03-09 17:41:50.970302+08', '2026-03-09 17:41:47.281059+08', '2026-03-09 17:41:50.970302+08', 'Representative');
INSERT INTO public.members VALUES ('c7427a49-97c7-4d97-992f-53812f28e40b', 'MBR-MMK1L8Y2', '22189995-8a3e-4780-b7c7-18d62b9f8fab', 'Avelinda', 'N', 'Ritchlind', NULL, '2026-03-10', 'Not Specified', 'Not Specified', 'STA.CRUZ BLK 11 LOT 11
STA. CRUZ BLK11 LOT 1
JOLLYNEIGHBORS STA.CRUZ', 'NAGA CITY', 'Camarines Sur', 'avelinda@gmail.com', '0987654321', 'CEO', 'N/A', NULL, '[]', 'approved', '2026-03-10', '', '11111111-1111-1111-1111-111111111111', '2026-03-10 11:20:22.132264+08', '2026-03-10 11:20:16.01156+08', '2026-03-10 11:20:22.132264+08', 'President');
INSERT INTO public.members VALUES ('91fafb1c-ec4b-4905-9531-3e26f6a6e2dc', 'MBR-MMK9BSKM', 'b600910f-7889-44b0-bf2a-244748e383b6', 'test', NULL, 'test', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'test1234@example.com', NULL, NULL, NULL, NULL, '[]', 'approved', NULL, NULL, NULL, NULL, '2026-03-10 14:56:51.816593+08', '2026-03-10 14:56:51.816593+08', 'Representative');
INSERT INTO public.members VALUES ('e6de7195-a947-4655-a2df-36709963acca', 'MBR-MMK9I3NL', '1661eec1-539d-45b7-a1d5-4203782a0d98', 'Isarog', 'Rog', 'ISAROG', NULL, '2026-03-10', 'Not Specified', 'Not Specified', 'STA.CRUZ BLK 11 LOT 11
STA. CRUZ BLK11 LOT 1
JOLLYNEIGHBORS STA.CRUZ', 'NAGA CITY', 'Camarines Sur', 'Isarog@gmail.com', '24681097531', 'Farmer', 'N/A', NULL, '[]', 'approved', NULL, NULL, NULL, NULL, '2026-03-10 15:01:46.116461+08', '2026-03-10 15:01:46.116461+08', 'Representative');
INSERT INTO public.members VALUES ('a25389e0-dd84-44ba-a760-248b92f02dc1', 'MBR-MMKA0QAK', 'b600910f-7889-44b0-bf2a-244748e383b6', 'test', NULL, 'test', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'officer1@example.com', NULL, NULL, NULL, NULL, '[]', 'approved', NULL, NULL, NULL, NULL, '2026-03-10 15:16:15.261007+08', '2026-03-10 15:16:15.261007+08', 'President');
INSERT INTO public.members VALUES ('6b2b7c60-0b71-4f15-8554-92a94229a1bd', 'MBR-MMKA0QAV', 'b600910f-7889-44b0-bf2a-244748e383b6', 'test', NULL, 'test', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'officer2@example.com', NULL, NULL, NULL, NULL, '[]', 'approved', NULL, NULL, NULL, NULL, '2026-03-10 15:16:15.271549+08', '2026-03-10 15:16:15.271549+08', 'Treasurer');
INSERT INTO public.members VALUES ('9dca7b04-2eb7-405c-bf43-b3ec9048e45e', 'MBR-MMMWLY7F', 'dd254464-063c-436b-823c-534b716d39f2', 'Mark', 'Da', 'mesa', NULL, '2026-03-12', 'Not Specified', 'Not Specified', 'Brgy', 'Naga City', 'Camarines Sur', 'mark@gmail.com', '1234567890', 'Student', 'N/A', NULL, '[]', 'approved', NULL, NULL, NULL, NULL, '2026-03-12 11:24:09.19713+08', '2026-03-12 11:24:09.19713+08', 'Representative');


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.profiles VALUES ('777b2468-b89d-4574-b255-d3236ec5ff90', 'officer1@coopwise.com', 'officer', NULL, NULL, 'officer-777b2468', '2025-10-16 11:39:21.086919+08', '2025-10-16 11:39:21.086919+08', 'New', 'New User', 'User', NULL, NULL);
INSERT INTO public.profiles VALUES ('44444444-4444-4444-4444-444444444444', 'officer.three', 'officer', 'Naciatrasco', 'Treasurer', 'OFF-003', '2025-10-29 07:56:09.641172+08', '2025-10-29 07:56:09.641172+08', 'Roberto', 'Roberto Cruz', 'Cruz', NULL, NULL);
INSERT INTO public.profiles VALUES ('55555555-5555-5555-5555-555555555555', 'officer.four', 'officer', 'Arise', 'Chairman', 'OFF-004', '2025-10-29 07:56:09.641172+08', '2025-10-29 07:56:09.641172+08', 'Ana', 'Cristina Dela', 'Cruz', NULL, NULL);
INSERT INTO public.profiles VALUES ('11111111-1111-1111-1111-111111111111', 'admin', 'administrator', 'NCCDO', 'System Administrator', 'ADMIN-001', '2025-11-12 14:38:05.915902+08', '2025-11-12 14:38:05.915902+08', 'XAVIER ANGELO JAMES', 'OSEA.', 'LAGATIC', 'admin@coopwise.com', NULL);
INSERT INTO public.profiles VALUES ('22222222-2222-2222-2222-222222222222', 'officer.one', 'training_head', 'NCCDO', 'Training Division Head', 'OFF-001', '2025-10-29 07:56:09.641172+08', '2025-10-29 07:56:09.641172+08', 'VINCE CARLO', 'P.', 'SAN JOAQUIN', 'training@coopwise.com', NULL);
INSERT INTO public.profiles VALUES ('33333333-3333-3333-3333-333333333333', 'officer.two', 'compliance_head', 'NCCDO', 'Compliance Division Head', 'OFF-002', '2025-10-29 07:56:09.641172+08', '2025-10-29 07:56:09.641172+08', 'RONALD ALLAN', 'N.', 'POLAGÑE', 'compliance@coopwise.com', NULL);
INSERT INTO public.profiles VALUES ('b0125e82-3622-4d7c-ab61-4a4ed3333e37', '123123213123123', 'cooperative', 'Testing user', NULL, NULL, '2026-03-04 16:01:20.841903+08', '2026-03-04 16:01:20.841903+08', 'Testing user', NULL, '(Cooperative)', NULL, 'x4oZx0Ge');
INSERT INTO public.profiles VALUES ('38edb99e-31ca-4ed6-b3d0-21aad23a4280', '123456789', 'cooperative', 'Test2', NULL, NULL, '2026-03-09 09:53:03.223549+08', '2026-03-09 09:53:03.223549+08', 'Test2', NULL, '(Cooperative)', NULL, '%&hHWVI1');
INSERT INTO public.profiles VALUES ('ed659a87-d4cf-44b3-a6dd-16372c0d2502', 'test@gmail.com', 'officer', 'Testing user', 'Representative', NULL, '2026-03-10 14:11:41.740762+08', '2026-03-10 14:11:41.740762+08', 'Test', NULL, 'Officer Compliance', NULL, '3jflL#Av');
INSERT INTO public.profiles VALUES ('c3bd0d46-a787-4594-bcbe-30b9c5894a62', 'xavierangelojames@gmail.com', 'officer', 'Professional IT Solutions Coop', 'President', NULL, '2026-03-10 14:11:41.744205+08', '2026-03-10 14:11:41.744205+08', 'Bongbong', NULL, 'Marcos', NULL, 'YCUWord!');
INSERT INTO public.profiles VALUES ('fbb6ec1c-ce12-4209-834a-0f06d846f01e', 'test1234@example.com', 'officer', 'CamSur Rice Granary Coop', 'Representative', NULL, '2026-03-10 14:56:51.831367+08', '2026-03-10 14:56:51.831367+08', 'test', NULL, 'test', NULL, 'v&4w62eT');
INSERT INTO public.profiles VALUES ('1bf31211-ef12-4541-8465-cd28cc5572fe', 'Isarog@gmail.com', 'officer', 'Isarog Farmers Producers', 'Representative', NULL, '2026-03-10 15:01:46.128681+08', '2026-03-10 15:01:46.128681+08', 'Isarog', NULL, 'ISAROG', NULL, '#n@$WW9R');
INSERT INTO public.profiles VALUES ('d8e65d86-a761-4947-a114-6c4ce0007fa0', '1234567890', 'cooperative', 'NagaCoop', NULL, NULL, '2026-03-12 11:23:10.008053+08', '2026-03-12 11:23:10.008053+08', 'NagaCoop', NULL, '(Cooperative)', NULL, 'cAbVGuCD');
INSERT INTO public.profiles VALUES ('28e41a4e-ecb2-4991-a2ee-805863480bcc', 'coop_dd2544', 'officer', 'NagaCoop', 'Representative', NULL, '2026-03-12 11:24:09.22631+08', '2026-03-12 11:24:09.22631+08', 'Mark', NULL, 'mesa', NULL, 'V!#N*j7R');


--
-- Data for Name: training_registrations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.training_registrations VALUES ('cf6f0597-4be2-427b-9acc-999fc6b49a65', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222', '2025-10-14 07:56:09.641172+08');
INSERT INTO public.training_registrations VALUES ('212d0931-1b5c-4841-9416-d1cfc8d7407c', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '33333333-3333-3333-3333-333333333333', '2025-10-14 07:56:09.641172+08');
INSERT INTO public.training_registrations VALUES ('2f432bb7-c2ca-4970-9367-fdc231eca5df', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '44444444-4444-4444-4444-444444444444', '2025-10-14 07:56:09.641172+08');
INSERT INTO public.training_registrations VALUES ('c3262ad9-423c-4ec7-bbcb-ff733c400a38', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '55555555-5555-5555-5555-555555555555', '2025-10-14 07:56:09.641172+08');
INSERT INTO public.training_registrations VALUES ('808b3cea-ed82-4170-8053-3bdfe6e386fa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', '2025-10-29 07:56:09.641172+08');
INSERT INTO public.training_registrations VALUES ('a51f9eaa-bbd8-44c9-b50c-316e72687db3', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '55555555-5555-5555-5555-555555555555', '2025-10-29 07:56:09.641172+08');
INSERT INTO public.training_registrations VALUES ('82308d44-1856-436c-8c95-9b06220e0ced', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', '2025-10-29 09:51:15.470508+08');
INSERT INTO public.training_registrations VALUES ('64371670-9df0-413b-b60d-49390baa9a2b', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '777b2468-b89d-4574-b255-d3236ec5ff90', '2025-11-11 15:17:11.678225+08');
INSERT INTO public.training_registrations VALUES ('f86886cd-8cab-41bd-96c8-7ae2be382033', 'ce223126-0198-4ef0-ab93-15e47661921d', '33333333-3333-3333-3333-333333333333', '2025-11-17 23:53:15.32321+08');
INSERT INTO public.training_registrations VALUES ('638f2c7a-a107-4a8e-ae3c-3d49f1f76191', '96f8d196-011b-43e8-97b7-4618c7c102c9', '33333333-3333-3333-3333-333333333333', '2025-11-18 00:27:35.161026+08');
INSERT INTO public.training_registrations VALUES ('fc10a6f3-1758-47be-85f5-a6e64d0b2633', '96f8d196-011b-43e8-97b7-4618c7c102c9', '55555555-5555-5555-5555-555555555555', '2025-11-18 00:28:33.054874+08');
INSERT INTO public.training_registrations VALUES ('df8d9112-e8df-49f9-96bb-c12538482123', '96f8d196-011b-43e8-97b7-4618c7c102c9', '22222222-2222-2222-2222-222222222222', '2025-11-18 00:28:36.833814+08');
INSERT INTO public.training_registrations VALUES ('1b673e90-e053-411e-be97-26a6d7388599', '5515da98-1a78-421a-a4a5-d504a359ab4d', '33333333-3333-3333-3333-333333333333', '2025-11-28 12:08:19.91472+08');
INSERT INTO public.training_registrations VALUES ('fcf904ea-0e24-4d59-b040-3fcb2a9f624f', '5515da98-1a78-421a-a4a5-d504a359ab4d', '55555555-5555-5555-5555-555555555555', '2025-11-28 12:17:42.337578+08');
INSERT INTO public.training_registrations VALUES ('280a0cf7-5c52-4ea5-aa85-2bd90e2a5e2a', '5515da98-1a78-421a-a4a5-d504a359ab4d', '22222222-2222-2222-2222-222222222222', '2025-11-28 12:17:47.133232+08');
INSERT INTO public.training_registrations VALUES ('d9eb85d6-375b-43e5-9eee-cd52d07afb0c', '5515da98-1a78-421a-a4a5-d504a359ab4d', '777b2468-b89d-4574-b255-d3236ec5ff90', '2025-11-28 12:17:52.766808+08');
INSERT INTO public.training_registrations VALUES ('561cfa2e-8c7d-4867-b22c-5db5830c0a88', '96f8d196-011b-43e8-97b7-4618c7c102c9', '44444444-4444-4444-4444-444444444444', '2025-11-28 12:17:56.34971+08');
INSERT INTO public.training_registrations VALUES ('6fccbf7b-3936-443c-823e-a89e21121791', '93b5cc50-579f-48e9-adb6-a31564777849', '33333333-3333-3333-3333-333333333333', '2025-11-28 16:48:43.127564+08');
INSERT INTO public.training_registrations VALUES ('ad3d681f-e2b9-4b96-8ac6-dc91016472ca', '7d1e222e-cf73-45f4-9d52-0736ba071bda', '55555555-5555-5555-5555-555555555555', '2026-01-06 12:00:11.062898+08');
INSERT INTO public.training_registrations VALUES ('ea27611f-eedb-4be6-a0df-f4deb380399b', '7d1e222e-cf73-45f4-9d52-0736ba071bda', '22222222-2222-2222-2222-222222222222', '2026-01-06 12:00:14.411542+08');
INSERT INTO public.training_registrations VALUES ('0951c403-9ff9-4bc8-a21a-5d8aa325a08f', '7d1e222e-cf73-45f4-9d52-0736ba071bda', '33333333-3333-3333-3333-333333333333', '2026-01-06 12:00:18.413461+08');
INSERT INTO public.training_registrations VALUES ('43e85882-8d80-4598-86ab-693a7129ecc5', '7d1e222e-cf73-45f4-9d52-0736ba071bda', '777b2468-b89d-4574-b255-d3236ec5ff90', '2026-01-06 12:00:21.98639+08');
INSERT INTO public.training_registrations VALUES ('ee027e8d-ce70-435e-8bb0-28bfcf31e507', '7d1e222e-cf73-45f4-9d52-0736ba071bda', '44444444-4444-4444-4444-444444444444', '2026-01-06 12:00:25.945801+08');
INSERT INTO public.training_registrations VALUES ('a23fc93c-0bda-4dc1-b717-0585b67cf7a5', '4f004db1-deda-45a9-8433-91a6794e82e8', '33333333-3333-3333-3333-333333333333', '2026-01-09 18:23:46.13518+08');
INSERT INTO public.training_registrations VALUES ('63a2fa92-acc2-4e0c-9dc2-a243f5dcebc7', 'ce223126-0198-4ef0-ab93-15e47661921d', '55555555-5555-5555-5555-555555555555', '2026-01-14 09:47:54.722505+08');
INSERT INTO public.training_registrations VALUES ('e08b916b-0ef9-4ed0-88c4-0f54cf3a6a78', 'ce223126-0198-4ef0-ab93-15e47661921d', '44444444-4444-4444-4444-444444444444', '2026-01-14 09:47:56.541697+08');
INSERT INTO public.training_registrations VALUES ('9697f966-799d-4403-8d36-5dc3f2d6cbb5', 'ce223126-0198-4ef0-ab93-15e47661921d', '777b2468-b89d-4574-b255-d3236ec5ff90', '2026-01-14 09:47:57.727279+08');
INSERT INTO public.training_registrations VALUES ('24e6d412-b0cd-4508-865e-6de97385c04d', '984d1958-4b95-4e87-8591-32a4b9583c77', '777b2468-b89d-4574-b255-d3236ec5ff90', '2026-01-14 09:53:14.598718+08');
INSERT INTO public.training_registrations VALUES ('c2587337-7169-4c13-99bd-55ef0d178b01', '984d1958-4b95-4e87-8591-32a4b9583c77', '44444444-4444-4444-4444-444444444444', '2026-01-14 09:53:16.371814+08');
INSERT INTO public.training_registrations VALUES ('3929f0b6-ed13-4ca2-9cdb-15a5a96ea522', '984d1958-4b95-4e87-8591-32a4b9583c77', '55555555-5555-5555-5555-555555555555', '2026-01-14 09:53:17.842167+08');
INSERT INTO public.training_registrations VALUES ('0ef4b60a-1dd8-446d-a4a7-eccecbd5b942', '99025335-82c0-4e79-a721-46331d9bdbaf', '55555555-5555-5555-5555-555555555555', '2026-01-16 10:13:18.626983+08');
INSERT INTO public.training_registrations VALUES ('03cea0dd-397f-4dff-9074-d3c4c35fb1c1', '99025335-82c0-4e79-a721-46331d9bdbaf', '44444444-4444-4444-4444-444444444444', '2026-01-16 10:13:20.357852+08');
INSERT INTO public.training_registrations VALUES ('7d39165b-4cea-43b4-acdb-65a3a9451424', '99025335-82c0-4e79-a721-46331d9bdbaf', '777b2468-b89d-4574-b255-d3236ec5ff90', '2026-01-16 10:13:21.746476+08');
INSERT INTO public.training_registrations VALUES ('7597fcd1-49b7-4eb8-a271-c6ec2456369a', '99025335-82c0-4e79-a721-46331d9bdbaf', '33333333-3333-3333-3333-333333333333', '2026-01-16 10:13:58.897152+08');
INSERT INTO public.training_registrations VALUES ('8b83b75f-ebb1-41c9-9652-667468fe5a30', '3aa45134-f642-4448-8b6f-7cde903e3b96', '777b2468-b89d-4574-b255-d3236ec5ff90', '2026-02-24 15:37:01.414871+08');
INSERT INTO public.training_registrations VALUES ('f37b0c9d-aae7-46c2-8d04-13a7f8687b5f', 'a092f6e1-8bf1-4a72-8d29-2151593afbf9', '33333333-3333-3333-3333-333333333333', '2026-02-25 19:34:19.096949+08');
INSERT INTO public.training_registrations VALUES ('4ffeb9f7-17ba-457d-81d7-cc1b06c4117e', 'ae99a6a9-c3a9-448f-a7e7-fbbdd892f562', '33333333-3333-3333-3333-333333333333', '2026-02-26 10:11:53.442809+08');
INSERT INTO public.training_registrations VALUES ('b3330d1b-3b41-4250-beac-8d722909c212', '984d1958-4b95-4e87-8591-32a4b9583c77', '33333333-3333-3333-3333-333333333333', '2026-02-26 10:11:59.708797+08');
INSERT INTO public.training_registrations VALUES ('362d5e47-f198-47ba-a81b-594d60458cbb', '3aa45134-f642-4448-8b6f-7cde903e3b96', '33333333-3333-3333-3333-333333333333', '2026-03-03 15:09:25.613652+08');
INSERT INTO public.training_registrations VALUES ('664ba74a-c244-40b0-99fb-2f70eeb43f12', '31ea07d3-78ac-46e3-8a8f-2ca4f52d6fe3', '55555555-5555-5555-5555-555555555555', '2026-03-03 16:39:41.412783+08');
INSERT INTO public.training_registrations VALUES ('fa05d20a-d997-4c8d-b741-54c015143ecc', '31ea07d3-78ac-46e3-8a8f-2ca4f52d6fe3', '44444444-4444-4444-4444-444444444444', '2026-03-03 16:39:44.252869+08');
INSERT INTO public.training_registrations VALUES ('b3c4cf82-df16-411e-ac7c-fcd49e3c9075', '31ea07d3-78ac-46e3-8a8f-2ca4f52d6fe3', '777b2468-b89d-4574-b255-d3236ec5ff90', '2026-03-03 16:39:46.80784+08');
INSERT INTO public.training_registrations VALUES ('304b5d0f-98a9-456c-887a-1165efe9010e', '47463ba6-c04a-4fd6-932c-31493ea6235b', '33333333-3333-3333-3333-333333333333', '2026-03-03 23:27:24.508477+08');
INSERT INTO public.training_registrations VALUES ('2ecfc20e-4b94-4523-aa7b-9fe306dba947', '31ea07d3-78ac-46e3-8a8f-2ca4f52d6fe3', '33333333-3333-3333-3333-333333333333', '2026-03-03 23:27:26.325011+08');
INSERT INTO public.training_registrations VALUES ('96ed0c25-e347-4032-ba88-9038cad4157b', '47463ba6-c04a-4fd6-932c-31493ea6235b', '55555555-5555-5555-5555-555555555555', '2026-03-03 23:28:06.237578+08');
INSERT INTO public.training_registrations VALUES ('b31d822f-1669-4f9a-8320-c66a8d34c314', '47463ba6-c04a-4fd6-932c-31493ea6235b', '44444444-4444-4444-4444-444444444444', '2026-03-03 23:28:08.077276+08');
INSERT INTO public.training_registrations VALUES ('e182cf91-621f-4db9-98fc-1149a6c83e2c', '47463ba6-c04a-4fd6-932c-31493ea6235b', '777b2468-b89d-4574-b255-d3236ec5ff90', '2026-03-03 23:28:09.367447+08');


--
-- Data for Name: training_suggestions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.training_suggestions VALUES ('4f40ea19-1647-4416-b2db-c7a54dfd51a6', 'Advanced Financial Planning', 'Important', 'Financial Management', '2025-11-28', 'adasd', 'high', '11111111-1111-1111-1111-111111111111', '2025-11-28 11:17:19.533948+08', 'implemented');
INSERT INTO public.training_suggestions VALUES ('f72b6a47-3a45-44ab-8f75-da5e6ed6d365', 'asdasd', 'asdasd', 'Financial Management', '2025-11-27', 'asdasd', 'medium', '11111111-1111-1111-1111-111111111111', '2025-11-27 10:03:42.234811+08', 'implemented');
INSERT INTO public.training_suggestions VALUES ('e0f088ec-9ffa-4dac-9749-7b4f778c801b', 'Jeep Maintenance Training', 'Important', 'Other', '2025-11-28', 'sadasd', 'medium', '11111111-1111-1111-1111-111111111111', '2025-11-28 13:42:57.763767+08', 'implemented');
INSERT INTO public.training_suggestions VALUES ('59063d64-0bc2-4dd2-b538-3e8ff61c271d', 'sadasd', 'asdasd', 'Governance Training', '2025-11-28', 'asdasd', 'medium', '11111111-1111-1111-1111-111111111111', '2025-11-28 09:58:48.827519+08', 'rejected');
INSERT INTO public.training_suggestions VALUES ('3207a8d2-bfdc-4c38-b072-593b52a28622', 'asdasd', 'asdasd', 'Marketing and Sales', '2025-11-28', 'asdasd', 'medium', '11111111-1111-1111-1111-111111111111', '2025-11-28 10:45:06.777661+08', 'rejected');
INSERT INTO public.training_suggestions VALUES ('11704bea-0ab8-4636-8549-8bd70934376f', 'Boxing', 'Para sobrang angas ba', 'Leadership Development', '2025-11-28', 'Benefit of protecting the cooperative', 'urgent', '11111111-1111-1111-1111-111111111111', '2025-11-28 16:23:22.912028+08', 'implemented');
INSERT INTO public.training_suggestions VALUES ('55df9fe8-fa2e-4c14-aa73-409c57724909', 'BIR REQUIREMENTS', 'Requirments ', 'Legal Compliance', '2025-11-28', 'Because', 'medium', '11111111-1111-1111-1111-111111111111', '2025-11-28 16:51:54.420579+08', 'implemented');
INSERT INTO public.training_suggestions VALUES ('41a60e58-8fa5-4df4-ac08-32a05576a629', 'FInance', 'Finance', 'Financial Management', '2025-11-28', 'sadsad', 'medium', '11111111-1111-1111-1111-111111111111', '2025-11-28 16:57:37.011134+08', 'implemented');
INSERT INTO public.training_suggestions VALUES ('933f683d-6fce-41e6-accd-fd938b1a481d', 'Proper Financing', 'Proper Financing benefits the cooperatives', 'Financial Management', '2025-11-28', 'It helps the cooperative ', 'medium', '11111111-1111-1111-1111-111111111111', '2025-11-28 22:17:14.641671+08', 'implemented');
INSERT INTO public.training_suggestions VALUES ('71da410b-a6c2-4c89-84ce-6eb14eb6c63e', 'CPR TRAINING', 'asdasdsad', 'Human Resources', '2025-11-28', 'Because', 'medium', '11111111-1111-1111-1111-111111111111', '2025-11-28 10:51:03.595029+08', 'rejected');
INSERT INTO public.training_suggestions VALUES ('6ebf4769-df41-48f6-aaf4-299a72288747', 'Governance Training', 'Important', 'Governance Training', '2025-11-28', 'sadasd', 'medium', '11111111-1111-1111-1111-111111111111', '2025-11-28 10:58:00.923466+08', 'implemented');
INSERT INTO public.training_suggestions VALUES ('7d0b60b1-f513-40b4-91f4-f5bd56db4afd', 'Website Workshop', 'asasdasd', 'Governance Training', '2026-01-09', 'To understand how to use the coopwise', 'high', '11111111-1111-1111-1111-111111111111', '2026-01-04 18:37:13.643807+08', 'implemented');
INSERT INTO public.training_suggestions VALUES ('e17fbfde-1cab-45cf-95a4-fd7eff5d613d', 'Farmer crop seminar', 'To give farmers ideas for healthy crop ', 'Other', '2026-01-08', 'To help local farmers', 'high', '11111111-1111-1111-1111-111111111111', '2026-01-08 08:14:34.678577+08', 'rejected');
INSERT INTO public.training_suggestions VALUES ('f88d07b2-f109-4eca-b443-45be2a468740', 'name fix', 'namefix', 'Financial Management', '2026-01-09', 'namefix', 'medium', '11111111-1111-1111-1111-111111111111', '2026-01-09 14:52:18.16856+08', 'implemented');
INSERT INTO public.training_suggestions VALUES ('10c97d53-94c5-44b3-8e50-2a7cdc3e00c8', 'Test2', 'test2', 'Financial Management', '2026-01-09', 'Test2', 'high', '11111111-1111-1111-1111-111111111111', '2026-01-09 14:18:41.323911+08', 'implemented');
INSERT INTO public.training_suggestions VALUES ('baabc1fe-9268-4b9c-ac15-aeb8240d5d64', 'try', 'try', 'Financial Management', '2026-01-09', 'try', 'urgent', '11111111-1111-1111-1111-111111111111', '2026-01-09 14:29:11.612768+08', 'rejected');
INSERT INTO public.training_suggestions VALUES ('35135afb-2e98-4d34-bebc-ee8add18e2ec', 'Test', 'Desc', 'Other', NULL, NULL, 'medium', '33333333-3333-3333-3333-333333333333', '2026-03-03 14:47:00.260857+08', 'pending');
INSERT INTO public.training_suggestions VALUES ('3ec7bc20-a564-4970-ad7e-bb03c9b47463', 'Governance Training', 'Need', 'Governance Training', NULL, 'Urgent Trianing', 'urgent', '44444444-4444-4444-4444-444444444444', '2026-03-03 15:10:54.496764+08', 'implemented');


--
-- Data for Name: trainings; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.trainings VALUES ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'TRN-2024-005', 'Leadership Excellence Workshop', 'Leadership Development', '2025-10-18', '2025-10-18', '2025-10-18', '09:00:00', 'Grand Conference Hall', 'Dr. Pedro Martinez', 35, 'completed', '2025-10-29 07:56:09.641172+08', '2025-10-29 07:56:09.641172+08', '[]');
INSERT INTO public.trainings VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'TRN-2024-002', 'Digital Marketing for Coops', 'Marketing', '2025-11-02', '2025-11-02', '2025-11-04', '10:00:00', 'Training Center B', 'Prof. Juan Dela Cruz', 25, 'completed', '2025-10-29 07:56:09.641172+08', '2025-11-28 22:20:22.845089+08', '[]');
INSERT INTO public.trainings VALUES ('5515da98-1a78-421a-a4a5-d504a359ab4d', 'TRN-MIIC9PKK', 'Advanced Financial Planning', 'Financial Management', '2026-01-09', '2026-01-09', '2026-01-10', '09:00:00', 'Advanced Financial Planning', 'Dr. A. Smith', 50, 'completed', '2025-11-28 12:04:51.719504+08', '2026-01-09 18:19:58.135304+08', '[]');
INSERT INTO public.trainings VALUES ('7d1e222e-cf73-45f4-9d52-0736ba071bda', 'TRN-MIIMKEMU', 'BIR REQUIREMENTS', 'Legal Compliance', '2026-01-09', '2026-01-09', '2026-01-10', '09:00:00', 'Google meet', 'Sir chin', 50, 'ongoing', '2025-11-28 16:53:06.119711+08', '2026-01-09 18:20:36.483478+08', '[]');
INSERT INTO public.trainings VALUES ('4f004db1-deda-45a9-8433-91a6794e82e8', 'TRN-MK6Q9100', 'name fix', 'Financial Management', '2026-01-09', '2026-01-09', '2026-01-09', '09:00:00', 'Online', 'asd', 50, 'upcoming', '2026-01-09 18:22:25.103506+08', '2026-01-09 18:22:25.103506+08', '[]');
INSERT INTO public.trainings VALUES ('93b5cc50-579f-48e9-adb6-a31564777849', 'TRN-MIIFSUFX', 'Jeep Maintenance Training', 'Other', '2026-01-09', '2026-01-09', '2026-01-10', '09:00:00', 'Unc Covered Court', 'Dr. A. Smith', 50, 'ongoing', '2025-11-28 13:43:42.615005+08', '2026-01-09 18:38:04.822218+08', '[]');
INSERT INTO public.trainings VALUES ('99025335-82c0-4e79-a721-46331d9bdbaf', 'TRN-2026-950', 'Member Education Seminar', 'Pre-Education for potential Members', '2026-01-09', '2026-01-09', '2026-01-09', '10:00:00', 'Unc Covered Court', 'Dr. A. Smith', 27, 'ongoing', '2026-01-09 10:43:35.531378+08', '2026-01-09 18:49:27.006268+08', '[]');
INSERT INTO public.trainings VALUES ('96f8d196-011b-43e8-97b7-4618c7c102c9', 'TRN-2025-914', 'Road Rerouting ', 'Rerouting', '2026-01-09', '2026-01-09', '2026-01-09', '23:59:00', 'Online', 'asd', 25, 'completed', '2025-11-17 23:59:32.776171+08', '2026-01-09 18:57:42.292309+08', '[]');
INSERT INTO public.trainings VALUES ('ae99a6a9-c3a9-448f-a7e7-fbbdd892f562', 'TRN-2026-638', 'Finance', 'Financial Management', '2026-01-14', '2026-01-14', '2026-01-14', '09:36:00', 'Online', 'asd', 30, 'upcoming', '2026-01-14 09:36:34.774149+08', '2026-01-14 09:36:34.774149+08', '[]');
INSERT INTO public.trainings VALUES ('a092f6e1-8bf1-4a72-8d29-2151593afbf9', 'TRN-2026-124', 'Testing date', 'Governance', '2026-01-14', '2026-01-14', '2026-01-16', '09:39:00', 'Online', 'asd', 30, 'upcoming', '2026-01-14 09:39:07.747106+08', '2026-01-14 09:39:07.747106+08', '[]');
INSERT INTO public.trainings VALUES ('ce223126-0198-4ef0-ab93-15e47661921d', 'TRN-2025-209', 'Financial Management Basics', 'Finance', '2026-01-16', '2026-01-16', '2026-01-09', '11:31:00', 'Online', 'Dr. A. Smith', 30, 'upcoming', '2025-11-13 11:31:32.021+08', '2026-01-14 09:47:26.999543+08', '[]');
INSERT INTO public.trainings VALUES ('545ea5a1-ffca-49ba-92c3-cae33e4f316d', 'TRN-MKDDCG2U', 'Test2', 'Financial Management', '2026-01-15', '2026-01-15', '2026-01-16', '09:00:00', 'Unc Covered Court', 'TBD', 50, 'upcoming', '2026-01-14 09:55:32.837002+08', '2026-01-14 09:55:32.837002+08', '[]');
INSERT INTO public.trainings VALUES ('3aa45134-f642-4448-8b6f-7cde903e3b96', 'TRN-580587-050', 'Website', 'Other', '2026-02-26', '2026-02-26', '2026-02-27', '15:36:00', 'CITY HALL', 'Ser', 50, 'upcoming', '2026-02-24 15:36:21.014173+08', '2026-02-24 15:36:21.014173+08', '[]');
INSERT INTO public.trainings VALUES ('984d1958-4b95-4e87-8591-32a4b9583c77', 'TRN-585928-331', 'Financial Management Basics', 'Financial Management', '2026-02-26', '2026-02-26', '2026-02-28', '11:31:00', 'Online', 'Dr. A. Smith', 30, 'completed', '2026-01-14 09:53:05.969834+08', '2026-02-26 10:12:49.595427+08', '[]');
INSERT INTO public.trainings VALUES ('31ea07d3-78ac-46e3-8a8f-2ca4f52d6fe3', 'TRN-MMACWPS4', 'Governance Training', 'Governance Training', '2026-03-10', '2026-03-10', '2026-03-10', '09:00:00', 'TBD', 'TBD', 50, 'upcoming', '2026-03-03 16:39:25.05235+08', '2026-03-03 16:39:25.05235+08', '[]');
INSERT INTO public.trainings VALUES ('47463ba6-c04a-4fd6-932c-31493ea6235b', 'TRN-625898-488', 'Governance', 'Governance', '2026-03-12', '2026-03-12', '2026-03-21', '23:26:00', 'City hall', 'TBD', 50, 'upcoming', '2026-03-03 23:27:05.927814+08', '2026-03-03 23:27:05.927814+08', '[]');


--
-- Name: activity_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.activity_logs_id_seq', 29, true);


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

\unrestrict gjRnn5LjFuhYXENKGAbcvAbn170sylepIUexJcqVl68i3vhbGsa4pDZkdyKLtwe

